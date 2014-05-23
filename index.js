var BSON = require('mongodb').BSON,
    Db = require('mongodb').Db,
    EventEmitter = require('events').EventEmitter,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    url = require('url'),
    util = require('util');

var PubSub = function (uri, options) {
  EventEmitter.call(this);

  // remember the timestamp of the last event received
  this._last = new Date();

  // internal message queue
  this._queue = [];

  // parse connection uri
  if (uri !== void 0) {
    uri = url.parse(uri);
  }
  else {
    uri = url.parse(Db.DEFAULT_URL);
  }

  // channel listeners
  this._channels = new EventEmitter();

  // collection name override
  this._collectionName = (options || {}).collection || 'buffer';

  // database connection
  this._db = new Db(/^\/([\w\-]+)[\w\-\/]*$/.exec(uri.pathname)[1], new Server(uri.hostname, uri.port, { "auto_reconnect": true }), { "w": 0 });

  var self = this;
  this._db.open(function (err) {
    if (err) throw err;

    // check for collection
    self._db.collectionNames(self._collectionName, function (err, items) {
      if (err) throw err;

      if (items.length === 0) {
        self._db.createCollection(self._collectionName, { "capped": true, "size": 1024 * 1024 * 5 }, function (err, buffer) {
          if (err) throw err;

          // message buffer
          self._buffer = buffer;

          // seed the first message before connecting
          buffer.insert({ "event": "seed", "timestamp": self._last }, function (err) {
            self._connect();
          });
        });
      }
      else {
        // collection exists, assume it has messages
        self._db.collection(self._collectionName, function (err, buffer) {
          if (err) throw err;

          // message buffer
          self._buffer = buffer;

          self._connect();
        });
      }
    });
  });

  return this;
};
util.inherits(PubSub, EventEmitter);

PubSub.prototype._connect = function () {
  var self = this;

  // event stream
  this._stream = this._buffer.find({ "timestamp": { "$gt": this._last } }, { "sort": { "$natural": 1 }, "tailable": true, "awaitdata": true }).stream();

  this.emit('open');

  this._stream.on('error', function (err) {
    throw err;
    self.close();
  });

  this._stream.on('close', function () {
    // console.log('connection closed');
    //TODO reconnect?
  });

  this._stream.on('data', function (message) {
    // console.log('message', util.inspect(message));
    self._channels.emit.apply(self._channels, message.args);
    self.emit.apply(self, message.args);
    self._last = message.timestamp;
  });

  // process queued messages in order
  while (this._queue.length > 0) {
    this.publish.apply(this, this._queue.pop());
  }
};

PubSub.prototype.subscribe = function (event, listener) {
  this._channels.addListener(event, listener);
  this.emit('subscribe', event);
  return this;
};

PubSub.prototype.unsubscribe = function (event) {
  if (event === void 0) {
    this._channels.removeAllListeners();
    event = 'all';
  }
  else {
    this._channels.removeAllListeners(event);
  }

  this.emit('unsubscribe', event);

  return this;
};

PubSub.prototype.publish = function (event) {
  var self = this;

  // create a serialized form of the array-like arguments object for stroage in the database
  var args = JSON.parse(JSON.stringify(arguments));
  args.length = arguments.length;

  if (this._db._state === 'connected') {
    // we have a connection, insert the message in the buffer
    this._buffer.insert({ "event": event, "timestamp": new Date(), "args": args }, function (err) {
      if (err) throw err;
      self.emit('publish', event);
    });
  }
  else {
    // we aren't connected yet, queue up the message internally
    self._queue.unshift(args);
  }

  return this;
};

PubSub.prototype.close = function () {
  // silently remove all channel listeners
  this._channels.removeAllListeners();

  // close the cursor stream to the buffer
  if (this._stream !== void 0 && typeof this._stream.destroy === 'function') {
    this._stream.destroy();
  }

  // close the database connection
  if (this._db !== void 0 && this._db._state === 'connected') {
    this._db.close(true); // force it shut
  }

  this.emit('close');

  return this;
};

module.exports = PubSub;
