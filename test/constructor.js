var tap = require('tap'),
    PubSub = require('../index.js');

tap.test('constructor using defaults', function (t) {
  var ps = new PubSub();
  ps.open(function () {
    ps._buffer.isCapped(function (err, capped) {
      t.equals(ps._uri, 'mongodb://localhost:27017/mongodb-pubsub', 'connection URI should be the default');
      t.equals(ps._collectionName, 'buffer', 'buffer collection should be the default');
      t.ok(capped, 'should be connected to the buffer collection');
      ps.close();
      t.end();
    });
  });
});

tap.test('constructor using specified MongoDB URI and buffer collection', function (t) {
  var ps = new PubSub('mongodb://localhost:27017/foo', 'bar');
  ps.open(function () {
    ps._buffer.isCapped(function (err, capped) {
      t.equals(ps._uri, 'mongodb://localhost:27017/foo', 'connection URI should be the specified MongoDB URI');
      t.equals(ps._collectionName, 'bar', 'buffer collection should be the specified collection');
      t.ok(capped, 'should be connected to the buffer collection');
      ps.close();
      t.end();
    });
  });
});
