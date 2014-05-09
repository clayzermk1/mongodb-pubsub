var tap = require('tap'),
    Collection = require('mongodb').Collection,
    Db = require('mongodb').Db,
    Stream = require('stream'),
    EventEmitter = require('events').EventEmitter,
    PubSub = require('../index.js'),
    util = require('util');

tap.test('construction using default MongoDB URL', function (t) {
  var ps = new PubSub();
  ps.on('open', function () {
    t.ok(ps instanceof PubSub, 'should return a PubSub instance');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});

tap.test('construction using custom MongoDB URL and options', function (t) {
  var ps = new PubSub('mongodb://localhost:27017/mongodb-pubsub', { "collection": "foo" });
  ps.on('open', function () {
    t.ok(ps instanceof PubSub, 'should return a PubSub instance');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
});
