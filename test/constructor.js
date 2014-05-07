var test = require('tap').test,
    PubSub = require('../index.js');

test('construction using default MongoDB URL', function (t) {
  var ps = new PubSub();
  t.type(ps, 'object', 'should return a PubSub instance');
  t.end();
});

test('construction using custom MongoDB URL', function (t) {
  var ps = new PubSub('mongodb://localhost:27017/mongodb-pubsub');
  t.type(ps, 'object', 'should return a PubSub instance');
  t.end();
});

test('instance has a _channels object', function (t) {
  var ps = new PubSub();
  t.type(ps._channels, 'object', 'should have a _channels object');
  t.end();
});
