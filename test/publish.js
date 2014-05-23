var test = require('tap').test,
    PubSub = require('../index.js');

test('publish is chainable', function (t) {
  var ps = new PubSub();
  ps.on('publish', function () {
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
  t.ok(ps.publish('foo', 'bar') instanceof PubSub, 'should chain');
});

test('publish emits a local event', function (t) {
  var ps = new PubSub();
  ps.on('publish', function (event) {
    t.equal(event, 'foo', 'publish should trigger an event');
    ps.close();
  });
  ps.publish('foo');
  ps.on('close', function () {
    t.end();
  });
});

test('publish sends messages to a specific channel', function (t) {
  var ps = new PubSub();
  ps.subscribe('foo', function (data) {
    t.equal(data, 'bar', 'data should match');
    ps.close();
  });
  ps.publish('foo', 'bar');
  ps.on('close', function () {
    t.end();
  });
});
