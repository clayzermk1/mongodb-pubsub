var test = require('tap').test,
    PubSub = require('../index.js');

test('unsubscribe is chainable', function (t) {
  var ps = new PubSub();
  ps.on('open', function () {
    t.ok(ps.subscribe('foo', function () {}).unsubscribe('foo') instanceof PubSub, 'should chain');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

test('unsubscribe emits a local event', function (t) {
  var ps = new PubSub();
  ps.on('open', function () {
    ps.subscribe('foo', function () {}).unsubscribe('foo');
  });
  ps.on('unsubscribe', function (event) {
    t.equal(event, 'foo', 'unsubscribe should trigger an event');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

test('unsubscribe with event argument removes a specific channel listener', function (t) {
  t.plan(7);
  var ps = new PubSub();
  ps.on('open', function () {
    ps.subscribe('foo', function () {});
    ps.subscribe('bar', function () {});
    ps.subscribe('baz', function () {});
    t.ok(ps._channels.emit('foo'), 'foo should have a listener');
    t.ok(ps._channels.emit('bar'), 'bar should have a listener');
    t.ok(ps._channels.emit('baz'), 'baz should have a listener');
    ps.unsubscribe('foo');
  });
  ps.on('unsubscribe', function (event) {
    t.equal(event, 'foo', 'we should have only unsubscribed from foo');
    t.notOk(ps._channels.emit('foo'), 'foo should not have a listener');
    t.ok(ps._channels.emit('bar'), 'bar should have a listener');
    t.ok(ps._channels.emit('baz'), 'baz should have a listener');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

test('unsubscribe without arguments removes all channel listeners', function (t) {
  t.plan(7);
  var ps = new PubSub();
  ps.on('open', function () {
    ps.subscribe('foo', function () {});
    ps.subscribe('bar', function () {});
    ps.subscribe('baz', function () {});
    t.ok(ps._channels.emit('foo'), 'foo should have a listener');
    t.ok(ps._channels.emit('bar'), 'bar should have a listener');
    t.ok(ps._channels.emit('baz'), 'baz should have a listener');
    ps.unsubscribe();
  });
  ps.on('unsubscribe', function (event) {
    t.equal(event, 'all', 'we should have unsubscribed from all channels');
    t.notOk(ps._channels.emit('foo'), 'foo should not have a listener');
    t.notOk(ps._channels.emit('bar'), 'bar should not have a listener');
    t.notOk(ps._channels.emit('baz'), 'baz should not have a listener');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

