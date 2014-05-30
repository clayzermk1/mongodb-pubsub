var test = require('tap').test,
    PubSub = require('../index.js');

test('unsubscribe', function (t) {
  var ps = new PubSub('mongodb://test:test@kahana.mongohq.com:10050/clayzermk1');
  ps.open(function () {
    ps.on('unsubscribe', function (event) {
      t.ok(event, 'should trigger an event');
    });
    ps.subscribe('foo', function () {}, function () {
      t.ok(ps._channels.emit('foo'), 'should have a foo listener');
      ps.subscribe(function () {}, function () {
        t.ok(ps._channels.emit('message'), 'should have a message listener');
        ps.unsubscribe('foo', function (event) {
          t.notOk(ps._channels.emit('foo'), 'should not have a foo listener');
          t.ok(ps._channels.emit('message'), 'should have a message listener');
          ps.unsubscribe(function (event) {
            t.notOk(ps._channels.emit('foo'), 'should not have a foo listener');
            t.notOk(ps._channels.emit('message'), 'should not have a message listener');
            ps.close();
            t.end();
          });
        });
      });
    });
  });
});
