var JSData, Firebase;
if (!window && typeof module !== 'undefined' && module.exports) {
  JSData = require('js-data');
  Firebase = require('firebase');
} else {
  JSData = window.JSData;
  Firebase = window.Firebase;
}

var deepMixIn = JSData.DSUtils.deepMixIn;
var makePath = JSData.DSUtils.makePath;
var P = JSData.DSUtils.Promise;

function Defaults() {

}

function createRef(base, path) {
  return new Firebase(makePath(base, path));
}

/**
 * @doc constructor
 * @id DSFirebaseAdapter
 * @name DSFirebaseAdapter
 * @description
 * Adapter to be used with js-data. This adapter uses <method> to send/retrieve data to/from a <persistence layer>.
 */
function DSFirebaseAdapter(options) {
  options = options || {};

  if (typeof options.firebaseUrl !== 'string') {
    throw new Error('firebaseUrl is required!');
  }

  /**
   * @doc property
   * @id DSFirebaseAdapter.properties:defaults
   * @name defaults
   * @description
   * Reference to [DSFirebaseAdapter.defaults](/documentation/api/api/DSFirebaseAdapter.properties:defaults).
   */
  this.defaults = new Defaults();
  this.refs = {};
  deepMixIn(this.defaults, options);
}

DSFirebaseAdapter.prototype.getRef = function (name) {
  if (!this.refs[name]) {
    this.refs[name] = createRef(this.defaults.firebaseUrl, name);
  }
  return this.refs[name];
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:find
 * @name find
 * @description
 * Retrieve a single entity from Firebase.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.find(resourceConfig, id)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object.
 * @param {string|number} id Primary key of the entity to retrieve.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.find = function (resourceConfig, id) {
  var _this = this;
  return new P(function (resolve, reject) {
    var resourceRef = _this.getRef(resourceConfig.class);
    resourceRef.child(id).once('value', function (dataSnapshot) {
      resolve(dataSnapshot.val());
    }, reject, _this);
  });
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:findAll
 * @name findAll
 * @description
 * Retrieve a collection of entities from Firebase.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.findAll(resourceConfig[, params][, options])
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {object=} params Search query parameters. See the [query guide](/documentation/guide/queries/index).
 * @param {object=} options Optional configuration. Properties:
 *
 * - `{string=}` - `baseUrl` - Override the default base url.
 * - `{string=}` - `endpoint` - Override the default endpoint.
 * - `{object=}` - `params` - Additional query string parameters to add to the url.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.findAll = function (resourceConfig, params, options) {
  throw new Error('Not yet implemented!');
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:create
 * @name create
 * @description
 * Create a new entity in Firebase.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.create(resourceConfig, attrs)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {object} attrs The attribute payload.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.create = function (resourceConfig, attrs) {
  var _this = this;
  return new P(function (resolve, reject) {
    var resourceRef = _this.getRef(resourceConfig.class);
    var itemRef = resourceRef.push(attrs, function (err) {
      if (err) {
        return reject(err);
      } else {
        var id = itemRef.toString().replace(resourceRef.toString(), '');
        itemRef.child(resourceConfig.idAttribute).set(id, function (err) {
          if (err) {
            reject(err);
          } else {
            itemRef.once('value', function (dataSnapshot) {
              try {
                resolve(dataSnapshot.val());
              } catch (err) {
                reject(err);
              }
            }, reject, _this);
          }
        });
      }
    });
  });
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:update
 * @name update
 * @description
 * Update an entity in Firebase.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.update(resourceConfig, id, attrs)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {string|number} id Primary key of the entity to update.
 * @param {object} attrs The attribute payload.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.update = function (resourceConfig, id, attrs) {
  var _this = this;
  return new P(function (resolve, reject) {
    var resourceRef = _this.getRef(resourceConfig.class);
    var itemRef = resourceRef.child(id);
    itemRef.once('value', function (dataSnapshot) {
      try {
        var item = dataSnapshot.val();
        var fields = resourceConfig.relationFields;
        var removed = [];
        for (var i = 0; fields.length; i++) {
          removed.push(attrs[fields[i]]);
          delete attrs[fields[i]];
        }
        deepMixIn(item, attrs);
        for (i = 0; fields.length; i++) {
          attrs[fields[i]] = removed.shift();
        }
        itemRef.set(item, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(item);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, reject, _this);
  });
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:updateAll
 * @name updateAll
 * @description
 * Update a collection of entities in Firebase.
 *
 * Makes a `PUT` request.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.updateAll(resourceConfig, attrs[, params][, options])
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {object} attrs The attribute payload.
 * @param {object=} params Search query parameters. See the [query guide](/documentation/guide/queries/index).
 * @param {object=} options Optional configuration. Properties:
 *
 * - `{string=}` - `baseUrl` - Override the default base url.
 * - `{string=}` - `endpoint` - Override the default endpoint.
 * - `{object=}` - `params` - Additional query string parameters to add to the url.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.updateAll = function (resourceConfig, attrs, params, options) {
  throw new Error('Not yet implemented!');
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:destroy
 * @name destroy
 * @description
 * Delete an entity from Firebase.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.destroy(resourceConfig, id)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {string|number} id Primary key of the entity to destroy.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.destroy = function (resourceConfig, id) {
  var _this = this;
  return new P(function (resolve, reject) {
    var resourceRef = _this.getRef(resourceConfig.class);
    resourceRef.child(id).remove(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * @doc method
 * @id DSFirebaseAdapter.methods:destroyAll
 * @name destroyAll
 * @description
 * Delete a collection of entities from Firebase.
 *
 * ## Signature:
 * ```js
 * DSFirebaseAdapter.destroyAll(resourceConfig[, params][, options])
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {object=} params Search query parameters. See the [query guide](/documentation/guide/queries/index).
 * @param {object=} options Optional configuration. Properties:
 *
 * - `{string=}` - `baseUrl` - Override the default base url.
 * - `{string=}` - `endpoint` - Override the default endpoint.
 * - `{object=}` - `params` - Additional query string parameters to add to the url.
 *
 * @returns {Promise} Promise.
 */
DSFirebaseAdapter.prototype.destroyAll = function (resourceConfig, params, options) {
  throw new Error('Not yet implemented!');
};

module.exports = DSFirebaseAdapter;
