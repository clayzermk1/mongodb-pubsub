var test = require('tap').test,
    PubSub = require('../index.js');

test('publish', function (t) {
  var ps = new PubSub();
  ps.open(function () {
    ps.on('publish', function (event) {
      t.equal(event, 'foo', 'should trigger an event');
    });
    ps.subscribe('foo', function () {
      t.equals(arguments.length, 2, 'listener should be passed the arguments from publish');
      ps.close();
      t.end();
    }, function () {
      ps.publish('foo', 'bar', 'baz');
    });
  });
});
