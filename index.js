var BSON = require('mongodb').BSON,
    Db = require('mongodb').Db,
    EventEmitter = require('events').EventEmitter,
    MongoClient = require('mongodb').MongoClient,
    util = require('util');

var PubSub = function (url) {
  this._buffer;
  this._channels = new EventEmitter();
  this._lastId = BSON.BSON_DATA_MIN_KEY;

  var self = this;

  MongoClient.connect(url || Db.DEFAULT_URL, function (err, db) {
    if (err) throw new Error('Error connecting to MongoDB', err);

    self._buffer = db.collection('buffer');

    var stream = self._buffer.find({ "_id": { "$gt": self._lastId } }, { "sort": { "$natural": 1 }, "tailable": true, "awaitdata": true }).stream();

    stream.on('error', function (err) {
      throw new Error('Error reading messages', err);
    });

    stream.on('close', function () {
      console.log('cursor closed');
      db.close();
      //TODO reconnect?
    });

    stream.on('data', function (message) {
      console.log("message", util.inspect(message));
      self.emit.apply(self, message.args);
      channels.emit.apply(self, message.args);
      self._lastId = message._id;
    });

    return this;
  });
};
util.inherits(PubSub, EventEmitter);
module.exports = PubSub;

PubSub.prototype.subscribe = function (event, listener) {
  this._channels.addListener.apply(this, arguments);
  this.emit('subscribe', event);
  return this;
};

PubSub.prototype.unsubscribe = function (event) {
  this._channels.removeAllListeners.apply(this, arguments);
  this.emit('unsubscribe', event);
  return this;
};

PubSub.prototype.publish = function (event) {
  this._buffer.insert({ "event": event, "args": arguments }, function (err, res) {
    if (err) throw new Error("Error publishing data to ", event, err);
    //TODO do something with result?
    this.emit('publish', event);
  });
  return this;
};
