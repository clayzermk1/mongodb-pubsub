var test = require('tap').test,
    PubSub = require('../index.js');

test('subscribe', function (t) {
  var ps = new PubSub();
  ps.open(function () {
    ps.on('subscribe', function (event) {
      t.ok(event, 'should trigger an event');
    });
    ps.subscribe('foo', function () {}, function () {
      t.ok(ps._channels.emit('foo'), 'channel should have a listener');
      ps.subscribe(function () {}, function () {
        t.ok(ps._channels.emit('message'), 'channel should have a listener');
        ps.close();
        t.end();
      });
    });
  });
});
