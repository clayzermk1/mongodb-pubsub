var test = require('tap').test;
PubSub = require('../index.js');

test('10000 messages', function (t) {
  t.plan(10000);
  var j = 1;
  var ps = new PubSub();
  ps.subscribe('foo', function (data, i) {
    t.equals(data, 'bar', 'data should match');
    if (j === 10000) {
      console.timeEnd('10000-messages');
      ps.close();
    }
    j++;
  });
  console.time('10000-messages');
  for (var i = 1; i <= 10000; i++) {
    ps.publish('foo', 'bar', i);
  }
});

test('10000b message', function (t) {
  var jumbo = Buffer(10000).toString();
  var ps = new PubSub();
  ps.subscribe('foo', function (data) {
    t.equals(data, jumbo, 'data should match');
    console.time('10000b-message');
    ps.close();
  });
  ps.on('close', function () {
    t.end();
  });
  console.time('10000b-message');
  ps.publish('foo', jumbo);
});
