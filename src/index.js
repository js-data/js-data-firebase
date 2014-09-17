var deepMixIn = require('mout/object/deepMixIn');
var makePath = require('mout/string/makePath');
var P = require('es6-promise').Promise;

function Defaults() {

}

function createRef(base, path) {
  if (!window && typeof module !== 'undefined' && module.exports) {
    var Firebase = require('firebase');
    return new Firebase(makePath(base, path));
  } else {
    return new window.Firebase(makePath(base, path));
  }
}

/**
 * @doc constructor
 * @id FirebaseAdapter
 * @name FirebaseAdapter
 * @description
 * Adapter to be used with js-data. This adapter uses <method> to send/retrieve data to/from a <persistence layer>.
 */
function FirebaseAdapter(options) {
  options = options || {};

  if (typeof options.firebaseUrl !== 'string') {
    throw new Error('firebaseUrl is required!');
  }

  /**
   * @doc property
   * @id FirebaseAdapter.properties:defaults
   * @name defaults
   * @description
   * Reference to [FirebaseAdapter.defaults](/documentation/api/api/FirebaseAdapter.properties:defaults).
   */
  this.defaults = new Defaults();
  this.refs = {};
  deepMixIn(this.defaults, options);
}

FirebaseAdapter.prototype.getRef = function (name) {
  if (!this.refs[name]) {
    this.refs[name] = createRef(this.defaults.firebaseUrl, name);
  }
  return this.refs[name];
};

/**
 * @doc method
 * @id FirebaseAdapter.methods:find
 * @name find
 * @description
 * Retrieve a single entity from Firebase.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.find(resourceConfig, id)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object.
 * @param {string|number} id Primary key of the entity to retrieve.
 *
 * @returns {Promise} Promise.
 */
FirebaseAdapter.prototype.find = function (resourceConfig, id) {
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
 * @id FirebaseAdapter.methods:findAll
 * @name findAll
 * @description
 * Retrieve a collection of entities from Firebase.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.findAll(resourceConfig[, params][, options])
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
FirebaseAdapter.prototype.findAll = function (resourceConfig, params, options) {
  throw new Error('Not yet implemented!');
};

/**
 * @doc method
 * @id FirebaseAdapter.methods:create
 * @name create
 * @description
 * Create a new entity in Firebase.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.create(resourceConfig, attrs)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {object} attrs The attribute payload.
 *
 * @returns {Promise} Promise.
 */
FirebaseAdapter.prototype.create = function (resourceConfig, attrs) {
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
 * @id FirebaseAdapter.methods:update
 * @name update
 * @description
 * Update an entity in Firebase.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.update(resourceConfig, id, attrs)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {string|number} id Primary key of the entity to update.
 * @param {object} attrs The attribute payload.
 *
 * @returns {Promise} Promise.
 */
FirebaseAdapter.prototype.update = function (resourceConfig, id, attrs) {
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
 * @id FirebaseAdapter.methods:updateAll
 * @name updateAll
 * @description
 * Update a collection of entities in Firebase.
 *
 * Makes a `PUT` request.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.updateAll(resourceConfig, attrs[, params][, options])
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
FirebaseAdapter.prototype.updateAll = function (resourceConfig, attrs, params, options) {
  throw new Error('Not yet implemented!');
};

/**
 * @doc method
 * @id FirebaseAdapter.methods:destroy
 * @name destroy
 * @description
 * Delete an entity from Firebase.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.destroy(resourceConfig, id)
 * ```
 *
 * @param {object} resourceConfig DS resource definition object:
 * @param {string|number} id Primary key of the entity to destroy.
 *
 * @returns {Promise} Promise.
 */
FirebaseAdapter.prototype.destroy = function (resourceConfig, id) {
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
 * @id FirebaseAdapter.methods:destroyAll
 * @name destroyAll
 * @description
 * Delete a collection of entities from Firebase.
 *
 * ## Signature:
 * ```js
 * FirebaseAdapter.destroyAll(resourceConfig[, params][, options])
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
FirebaseAdapter.prototype.destroyAll = function (resourceConfig, params, options) {
  throw new Error('Not yet implemented!');
};

module.exports = FirebaseAdapter;
