var test = require('tap').test,
    PubSub = require('../index.js');

test('subscribe adds channel listeners', function (t) {
  var ps = new PubSub();
  ps.subscribe('foo', function () { console.log('foo'); });
  ps.subscribe('bar', function () { console.log('bar'); });
  ps.subscribe('baz', function () { console.log('baz'); });
  t.ok(ps._channels.emit('foo'), 'foo should have a listener');
  t.ok(ps._channels.emit('bar'), 'bar should have a listener');
  t.ok(ps._channels.emit('baz'), 'baz should have a listener');
  t.end();
});

test('subscribe emits a local event', function (t) {
  var ps = new PubSub();
  ps.on('subscribe', function (event) {
    t.ok(true, 'subscribe event callback was triggered');
    t.end();
  });
  ps.subscribe('foo', function () {});
});

test('subscribe is chainable', function (t) {
  var ps = new PubSub();
  t.type(ps.subscribe('foo', function () {}), 'object', 'should chain');
  t.end();
});
