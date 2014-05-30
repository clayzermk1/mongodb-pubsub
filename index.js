
/**
 * A MongoDB-backed pub/sub module.
 * @module PubSub
 */

var EventEmitter = require('events').EventEmitter,
    MongoClient = require('mongodb').MongoClient,
    util = require('util');

/**
 * @public
 * @constructor module:PubSub
 * @param {string} [uri=mongodb://localhost:27017/mongodb-pubsub] - The MongoDB connection URI to connect to, defaults to `mongodb://localhost:27017/mongodb-pubsub`.
 * @param {string} [collection=buffer] - The name of the collection to use as the message buffer, defaults to `buffer`.
 */
function PubSub (uri, collection) {
  EventEmitter.call(this);

  // remember the timestamp of the last event received
  this._last = new Date();

  // connection uri
  this._uri = uri || 'mongodb://localhost:27017/mongodb-pubsub';

  // channel listeners
  this._channels = new EventEmitter();

  // collection name override
  this._collectionName = collection || 'buffer';
};
util.inherits(PubSub, EventEmitter);

/**
 * Once the buffer collection is opened, connect with a tailed cursor.
 * @private
 * @function module:PubSub#_connect
 * @fires PubSub#error
 * @fires PubSub#message
 */
PubSub.prototype._connect = function () {
  var self = this;

  // event stream
  this._stream = this._buffer.find({ "timestamp": { "$gt": this._last } }, { "sort": { "$natural": 1 }, "tailable": true, "awaitdata": true }).stream();

  this._stream.on('error', function (err) {
    if (err != null) {
      this.emit('error', err);
      if (callback !== void 0) return callback(err);
    }
    self.close();
  });

  this._stream.on('close', function () {
    // console.log('connection closed');
    //TODO reconnect?
  });

  this._stream.on('data', function (message) {
    console.log('message', util.inspect(message));
    self._channels.emit.apply(self._channels, message.args);
    self.emit('message', message.args);
    self._last = message.timestamp;
  });
};

/**
 * Open a connection to the database and capped buffer collection. Create the collection if it doesn't exist.
 * @public
 * @function module:PubSub#open
 * @param {Function} [callback] The callback to call when collection is opened. Will be passed an `err` argument if it exists or `null` otherwise.
 * @fires PubSub#error
 * @fires PubSub#open
 */
PubSub.prototype.open = function (callback) {
  var self = this;
  MongoClient.connect(this._uri, { "server": { "poolSize": 1024,"auto_reconnect": true }, "db": { "w": 0 } }, function (err, db) {
    if (err != null) {
      self.emit('error', err);
      if (callback !== void 0) return callback(err);
    }

    self._db = db;

    // check for collection
    self._db.collectionNames(self._collectionName, function (err, collectionNames) {
      if (err != null) {
        self.emit('error', err);
        if (callback !== void 0) return callback(err);
      }

      if (collectionNames.length === 0) {
        self._db.createCollection(self._collectionName, { "capped": true, "size": 1024 * 1024 * 5 }, function (err, buffer) {
          if (err != null) {
            self.emit('error', err);
            if (callback !== void 0) return callback(err);
          }

          // message buffer
          self._buffer = buffer;

          // seed the first message before connecting
          buffer.insert({ "event": "seed", "timestamp": self._last }, function (err) {
            if (err != null) {
              self.emit('error', err);
              if (callback !== void 0) return callback(err);
            }
            self._connect();
            self.emit('open');
            if (callback !== void 0) return callback(null);
          });
        });
      }
      else {
        // collection exists, assume it has messages
        self._db.collection(self._collectionName, function (err, buffer) {
          if (err != null) {
            self.emit('error', err);
            if (callback !== void 0) return callback(err);
          }

          buffer.isCapped(function (err, capped) {
            if (err != null) {
              self.emit('error', err);
              if (callback !== void 0) return callback(err);
            }

            // message buffer
            self._buffer = buffer;
            self._connect();
            self.emit('open');
            if (callback !== void 0) return callback(null);
          });
        });
      }
    });
  });
};

/**
 * Subscribe to a message channel.
 * @public
 * @function module:PubSub#subscribe
 * @param {string} [event=message] - The name of the channel to subscribe to, defaults to `message`.
 * @param {Function} listener - The function to call when a channel receives a message.
 * @param {Function} [callback] - The callback to call when subscription is complete. Will be passed an `err` argument if it exists or `null` otherwise.
 * @fires PubSub#error
 * @fires PubSub#subscribe
 */
PubSub.prototype.subscribe = function (event, listener, callback) {
  if (arguments.length === 3) {
    // three arguments were provided, they better be a string, function, and a function
    if (typeof event !== 'string' || typeof listener !== 'function' || typeof callback !== 'function') {
      var err = new Error('invalid arguments supplied to subscribe()');
      this.emit('error', err);
      if (callback !== void 0) return callback(err);
    }
  }
  else if (arguments.length === 2) {
    // only two arguments were provided
    if (typeof event === 'function') {
      // looks like we got a listener and a callback as arguments
      callback = listener;
      listener = event;
      event = 'message';
    }
    else if (typeof event !== 'string') {
      var err = new Error('invalid arguments supplied to subscribe()');
      this.emit('error', err);
      if (callback !== void 0) return callback(err);
    }
  }
  else if (arguments.length === 1) {
    // only one argument, it better be a listener
    if (typeof event === 'function') {
      listener = event;
      event = 'message';
    }
    else {
      var err = new Error('invalid arguments supplied to subscribe(), listener is required');
      this.emit('error', err);
      if (callback !== void 0) return callback(err);
    }
  }
  else {
    var err = new Error('invalid arguments supplied to subscribe(), listener is required');
    this.emit('error', err);
    if (callback !== void 0) return callback(err);
  }

  this._channels.addListener(event, listener);

  this.emit('subscribe', event);
  if (callback !== void 0) return callback(null);
};

/**
 * Unsubscribe from a message channel.
 * @public
 * @function module:PubSub#unsubscribe
 * @param {string} [event=message] - The name of the channel to unsubscribe from, defaults to `message`.
 * @param {Function} [callback] - The callback to call when unsubscription is complete. Will be passed an `err` argument if it exists or `null` otherwise.
 * @fires PubSub#unsubscribe
 */
PubSub.prototype.unsubscribe = function (event, callback) {
  if (typeof event === 'function') {
    callback = event;
    event = 'message';
  }

  this._channels.removeAllListeners(event);

  this.emit('unsubscribe', event);
  if (callback !== void 0) return callback(null);
};

/**
 * Publish a message to a channel.
 * @public
 * @function module:PubSub#publish
 * @param {string} event - The name of the channel to publish to.
 * @param {...(string|number|Object|Date|boolean|Array)} [arg] - Arguments.
 * @param {Function} [callback] - The callback to call when publishing is complete. Will be passed an `err` argument if it exists or `null` otherwise.
 * @fires PubSub#error
 * @fires PubSub#publish
 */
PubSub.prototype.publish = function (event) {
  var self = this;

  // create a serialized form of the array-like arguments object for stroage in the database
  var args = JSON.parse(JSON.stringify(arguments));
  args.length = arguments.length;

  var callback;
  if (typeof arguments[arguments.length - 1] === 'function') {
    callback = arguments[arguments.length - 1];
    delete args[arguments.length - 1];
    args.length --;
  }

  // insert the message in the buffer
  this._buffer.insert({ "event": event, "timestamp": new Date(), "args": args }, function (err) {
    if (err != null) {
      self.emit('error', err);
      if (callback !== void 0) return callback(err);
    }
    self.emit('publish', event);
    if (callback !== void 0) return callback(null);
  });
};

/**
 * Closes database connections and removes channel listeners.
 * @public
 * @function module:PubSub#close
 * @param {Function} [callback] - The callback to call when publishing is complete. Will be passed an `err` argument if it exists or `null` otherwise.
 * @fires PubSub#close
 */
PubSub.prototype.close = function (callback) {
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
  if (callback !== void 0) return callback(null);
};

module.exports = PubSub;
