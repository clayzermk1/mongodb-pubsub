var PubSub = require('../index.js');



var j = 1;
var ps = new PubSub();
ps.subscribe('foo', function (data, i) {
  console.assert(data === 'bar', 'data should match');
  if (j === 100000) {
    console.timeEnd('10000-messages');
    ps.close();
  }
  j++;
});
console.time('10000-messages');
for (var i = 1; i <= 100000; i++) {
  ps.publish('foo', 'bar', i);
}
/*
var jumbo = Buffer(10000).toString();
ps = new PubSub();
ps.subscribe('foo', function (data) {
  console.assert(data.length === jumbo.length, 'data should match');
  console.time('10000b-message');
  ps.close();
});
console.time('10000b-message');
ps.publish('foo', jumbo);
*/
