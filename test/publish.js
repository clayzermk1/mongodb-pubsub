var test = require('tap').test,
    PubSub = require('../index.js');

test('publish', function (t) {
  var ps = new PubSub('mongodb://test:test@kahana.mongohq.com:10050/clayzermk1');
  ps.open(function () {
    ps.on('publish', function (event) {
      t.equal(event, 'foo', 'should trigger an event');
    });
    var hit = {};
    ps.subscribe('foo', function () {
      t.equals(arguments.length, 2, 'listener should be passed the arguments from publish');
      t.type(arguments[1], arguments[0], 'listener should accept multiple types');
      if (!hit[arguments[0]]) {
        hit[arguments[0]] = true;
        t.ok(true, 'should not duplicate messages');
      }
      else {
        t.ok(false, 'should not duplicate messages');
      }
      if (Object.keys(hit).length === 4) {
        setTimeout(function () { // wait for possible stragglers/duplicates
          ps.close();
          t.end();
        }, 500);
      }
    }, function () {
      ps.publish('foo', 'string', 's', function () {
        t.ok(true, 'should fire a callback');
      });
      ps.publish('foo', 'boolean', true);
      ps.publish('foo', 'number', 42);
      ps.publish('foo', 'object', { "k": "v" });
    });
  });
});
