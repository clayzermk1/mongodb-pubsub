var PubSub = require('../index.js'),
    util = require('util');

var ps = new PubSub();

ps.on('close', function () {
  console.log('close');
})

ps.subscribe('foo', function () {
  console.log('foo', util.inspect(arguments));
});

process.on('exit', function () {
  ps.close();
});

process.on('SIGINT', function () {
  process.exit();
});
