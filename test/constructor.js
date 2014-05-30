var tap = require('tap'),
    PubSub = require('../index.js');

tap.test('constructor', function (t) {
  var uri = 'mongodb://test:test@kahana.mongohq.com:10050/clayzermk1';
  var ps = new PubSub(uri);
  ps.open(function () {
    ps._buffer.isCapped(function (err, capped) {
      t.equals(ps._uri, uri, 'connection URI should be the specified MongoDB URI');
      t.equals(ps._collectionName, 'buffer', 'buffer collection should be the default collection');
      t.ok(capped, 'should be connected to the buffer collection');
      ps.close();
      t.end();
    });
  });
});
