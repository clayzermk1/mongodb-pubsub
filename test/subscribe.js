var test = require('tap').test,
    PubSub = require('../index.js');

test('subscribe adds channel listeners', function (t) {
  var ps = new PubSub();
  ps.subscribe('foo', function () {});
  ps.subscribe('bar', function () {});
  ps.subscribe('baz', function () {});
  ps.on('open', function () {
    t.ok(ps._channels.emit('foo'), 'foo should have a listener');
    t.ok(ps._channels.emit('bar'), 'bar should have a listener');
    t.ok(ps._channels.emit('baz'), 'baz should have a listener');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

test('subscribe emits a local event', function (t) {
  var ps = new PubSub();
  ps.on('open', function () {
    ps.subscribe('foo', function () {});
  });
  ps.on('subscribe', function (event) {
    t.ok(true, 'subscribe should trigger an event');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

test('subscribe is chainable', function (t) {
  var ps = new PubSub();
  ps.on('open', function () {
    t.ok(ps.subscribe('foo', function () {}) instanceof PubSub, 'should chain');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});
