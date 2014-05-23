var PubSub = require('../index.js'),
    util = require('util');

var ps = new PubSub();

ps.on('publish', function () {
  console.log('publish', util.inspect(arguments));
  ps.close();
});

ps.publish('foo', 'bar');

process.on('exit', function () {
  ps.close();
});

process.on('SIGINT', function () {
  process.exit();
});
