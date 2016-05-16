/*!
* js-data-firebase
* @version 3.0.0-beta.1 - Homepage <https://github.com/js-data/js-data-firebase>
* @author Jason Dobry <jason.dobry@gmail.com>
* @copyright (c) 2014-2016 Jason Dobry
* @license MIT <https://github.com/js-data/js-data-firebase/blob/master/LICENSE>
*
* @overview firebase adapter for js-data.
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('js-data'), require('js-data-adapter'), require('firebase')) :
  typeof define === 'function' && define.amd ? define('js-data-firebase', ['exports', 'js-data', 'js-data-adapter', 'firebase'], factory) :
  (factory((global.JSDataFirebase = global.JSDataFirebase || {}),global.JSData,global.Adapter,global.Firebase));
}(this, function (exports,jsData,jsDataAdapter,Firebase) { 'use strict';

  Firebase = 'default' in Firebase ? Firebase['default'] : Firebase;

  var babelHelpers = {};

  babelHelpers.slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  babelHelpers;

  var queue = [];
  var taskInProcess = false;

  function enqueue(task) {
    queue.push(task);
  }

  function dequeue() {
    if (queue.length && !taskInProcess) {
      taskInProcess = true;
      queue[0]();
    }
  }

  function queueTask(task) {
    if (!queue.length) {
      enqueue(task);
      dequeue();
    } else {
      enqueue(task);
    }
  }

  function createTask(fn) {
    return new jsData.utils.Promise(fn).then(function (result) {
      taskInProcess = false;
      queue.shift();
      setTimeout(dequeue, 0);
      return result;
    }, function (err) {
      taskInProcess = false;
      queue.shift();
      setTimeout(dequeue, 0);
      return jsData.utils.reject(err);
    });
  }

  var __super__ = jsDataAdapter.Adapter.prototype;

  var DEFAULTS = {
    /**
     * TODO
     *
     * @name FirebaseAdapter#basePath
     * @type {string}
     */
    basePath: ''
  };

  /**
   * {@link FirebaseAdapter} class.
   *
   * @name module:js-data-firebase.FirebaseAdapter
   * @see FirebaseAdapter
   */

  /**
   * {@link FirebaseAdapter} class. ES2015 default import.
   *
   * @name module:js-data-firebase.default
   * @see FirebaseAdapter
   */

  /**
   * FirebaseAdapter class.
   *
   * @example
   * import {DataStore} from 'js-data'
   * import {FirebaseAdapter} from 'js-data-firebase'
   * const store = new DataStore()
   * const adapter = new FirebaseAdapter()
   * store.registerAdapter('firebase', adapter, { 'default': true })
   *
   * @class FirebaseAdapter
   * @param {Object} [opts] Configuration opts.
   * @param {string} [opts.basePath=''] See {@link FirebaseAdapter#basePath}
   */
  function FirebaseAdapter(opts) {
    jsData.utils.classCallCheck(this, FirebaseAdapter);
    opts || (opts = {});
    jsData.utils.fillIn(opts, DEFAULTS);
    jsDataAdapter.Adapter.call(this, opts);

    /**
     * The ref instance used by this adapter. Use this directly when you
     * need to write custom queries.
     *
     * @name FirebaseAdapter#baseRef
     * @type {Object}
     */
    if (opts.baseRef || opts.basePath) {
      this.baseRef = opts.baseRef || new Firebase(opts.basePath);
    }
  }

  // Setup prototype inheritance from Adapter
  FirebaseAdapter.prototype = Object.create(jsDataAdapter.Adapter.prototype, {
    constructor: {
      value: FirebaseAdapter,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  Object.defineProperty(FirebaseAdapter, '__super__', {
    configurable: true,
    value: jsDataAdapter.Adapter
  });

  /**
   * Alternative to ES6 class syntax for extending `FirebaseAdapter`.
   *
   * @example <caption>Using the ES2015 class syntax.</caption>
   * class MyFirebaseAdapter extends FirebaseAdapter {...}
   * const adapter = new MyFirebaseAdapter()
   *
   * @example <caption>Using {@link FirebaseAdapter.extend}.</caption>
   * var instanceProps = {...}
   * var classProps = {...}
   *
   * var MyFirebaseAdapter = FirebaseAdapter.extend(instanceProps, classProps)
   * var adapter = new MyFirebaseAdapter()
   *
   * @method FirebaseAdapter.extend
   * @static
   * @param {Object} [instanceProps] Properties that will be added to the
   * prototype of the subclass.
   * @param {Object} [classProps] Properties that will be added as static
   * properties to the subclass itself.
   * @return {Constructor} Subclass of `FirebaseAdapter`.
   */
  FirebaseAdapter.extend = jsData.utils.extend;

  jsData.utils.addHiddenPropsToTarget(FirebaseAdapter.prototype, {
    /**
     * Retrieve the number of records that match the selection query. Internal
     * method used by Adapter#count.
     *
     * @name FirebaseAdapter#_count
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {Object} query Selection query.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */

    _count: function _count(mapper, query, opts) {
      query || (query = {});
      opts || (opts = {});
      return this._findAll(mapper, query, opts).then(function (result) {
        result[0] = result[0].length;
        return result;
      });
    },


    /**
     * Create a new record. Internal method used by Adapter#create.
     *
     * @name FirebaseAdapter#_create
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {Object} props The record to be created.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _create: function _create(mapper, props, opts) {
      props || (props = {});
      opts || (opts = {});
      return this._upsert(mapper, props, opts);
    },
    _upsert: function _upsert(mapper, props, opts) {
      var _this = this;

      var _props = jsData.utils.plainCopy(props);
      opts || (opts = {});

      var id = jsData.utils.get(_props, mapper.idAttribute);
      var collectionRef = this.getRef(mapper, opts);

      var itemRef = void 0;

      if (jsData.utils.isSorN(id)) {
        itemRef = collectionRef.child(id);
      } else {
        itemRef = collectionRef.push();
        jsData.utils.set(_props, mapper.idAttribute, itemRef.key());
      }

      return itemRef.set(_props).then(function () {
        return _this._once(itemRef);
      }).then(function (record) {
        if (!record) {
          throw new Error('Not Found');
        }
        return [record, { ref: itemRef }];
      });
    },
    _upsertBatch: function _upsertBatch(mapper, records, opts) {
      var _this2 = this;

      opts || (opts = {});

      var idAttribute = mapper.idAttribute;
      var refValueCollection = [];
      var collectionRef = this.getRef(mapper, opts);

      // generate path for each
      records.forEach(function (record) {
        var id = jsData.utils.get(record, idAttribute);
        var _props = jsData.utils.plainCopy(record);
        var itemRef = void 0;

        if (jsData.utils.isSorN(id)) {
          itemRef = collectionRef.child(id);
        } else {
          itemRef = collectionRef.push();
          jsData.utils.set(_props, idAttribute, itemRef.key());
        }
        refValueCollection.push({ ref: itemRef, props: _props });
      });

      return this._atomicUpdate(refValueCollection).then(function () {
        // since UDFs and timestamps can alter values on write, let's get the latest values
        return jsData.utils.Promise.all(refValueCollection.map(function (item) {
          return _this2._once(item.ref);
        }));
      }).then(function (records) {
        // just return the updated records and not the refs?
        return [records, { ref: refValueCollection.map(function (item) {
            return item.ref;
          }) }];
      });
    },
    _once: function _once(ref) {
      return ref.once('value').then(function (dataSnapshot) {
        if (!dataSnapshot.exists()) {
          return null;
        }
        return dataSnapshot.val();
      });
    },
    _atomicUpdate: function _atomicUpdate(refValueCollection) {
      var _this3 = this;

      // collection of refs and the new value to set at that ref
      // do a deep-path update off the baseRef
      // see https://www.firebase.com/blog/2015-09-24-atomic-writes-and-more.html
      var atomicUpdate = {};
      refValueCollection.forEach(function (item) {
        atomicUpdate[item.ref.toString().replace(_this3.baseRef.toString(), '')] = item.props;
      });
      return this.baseRef.update(atomicUpdate);
    },


    /**
     * Create multiple records in a single batch. Internal method used by
     * Adapter#createMany.
     *
     * @name FirebaseAdapter#_createMany
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {Object} records The records to be created.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _createMany: function _createMany(mapper, records, opts) {
      opts || (opts = {});
      return this._upsertBatch(mapper, records, opts);
    },


    /**
     * Destroy the record with the given primary key. Internal method used by
     * Adapter#destroy.
     *
     * @name FirebaseAdapter#_destroy
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {(string|number)} id Primary key of the record to destroy.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _destroy: function _destroy(mapper, id, opts) {
      opts || (opts = {});
      var ref = this.getRef(mapper, opts).child(id);
      return ref.remove().then(function () {
        return [undefined, { ref: ref }];
      });
    },


    /**
     * Destroy the records that match the selection query. Internal method used by
     * Adapter#destroyAll.
     *
     * @name FirebaseAdapter#_destroyAll
     * @method
     * @private
     * @param {Object} mapper the mapper.
     * @param {Object} [query] Selection query.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _destroyAll: function _destroyAll(mapper, query, opts) {
      var _this4 = this;

      query || (query = {});
      opts || (opts = {});

      return this._findAll(mapper, query).then(function (results) {
        var _results = babelHelpers.slicedToArray(results, 1);

        var records = _results[0];

        var idAttribute = mapper.idAttribute;
        return jsData.utils.Promise.all(records.map(function (record) {
          return _this4._destroy(mapper, jsData.utils.get(record, idAttribute), opts);
        }));
      }).then(function () {
        return [undefined, {}];
      });
    },


    /**
     * Retrieve the record with the given primary key. Internal method used by
     * Adapter#find.
     *
     * @name FirebaseAdapter#_find
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {(string|number)} id Primary key of the record to retrieve.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _find: function _find(mapper, id, opts) {
      opts || (opts = {});
      var itemRef = this.getRef(mapper, opts).child(id);
      return this._once(itemRef).then(function (record) {
        return [record, { ref: itemRef }];
      });
    },

    /**
      * Retrieve the records that match the selection query. Internal method used
      * by Adapter#findAll.
      *
      * @name FirebaseAdapter#_findAll
      * @method
      * @private
      * @param {Object} mapper The mapper.
      * @param {Object} query Selection query.
      * @param {Object} [opts] Configuration options.
      * @return {Promise}
      */
    _findAll: function _findAll(mapper, query, opts) {
      query || (query = {});
      opts || (opts = {});

      var collectionRef = this.getRef(mapper, opts);

      return collectionRef.once('value').then(function (dataSnapshot) {
        var data = dataSnapshot.val();
        if (!data) {
          return [[], { ref: collectionRef }];
        }
        var records = [];
        jsData.utils.forOwn(data, function (value, key) {
          records.push(value);
        });
        var _query = new jsData.Query({
          index: {
            getAll: function getAll() {
              return records;
            }
          }
        });
        return [_query.filter(query).run(), { ref: collectionRef }];
      });
    },


    /**
     * Retrieve the number of records that match the selection query. Internal
     * method used by Adapter#sum.
     *
     * @name FirebaseAdapter#_sum
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {string} field The field to sum.
     * @param {Object} query Selection query.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _sum: function _sum(mapper, field, query, opts) {
      return this._findAll(mapper, query, opts).then(function (result) {
        result[0] = result[0].reduce(function (sum, record) {
          return sum + (jsData.utils.get(record, field) || 0);
        }, 0);
        return result;
      });
    },


    /**
     * Apply the given update to the record with the specified primary key.
     * Internal method used by Adapter#update.
     *
     * @name FirebaseAdapter#_update
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {(string|number)} id The primary key of the record to be updated.
     * @param {Object} props The update to apply to the record.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _update: function _update(mapper, id, props, opts) {
      var _this5 = this;

      props || (props = {});
      opts || (opts = {});

      var itemRef = this.getRef(mapper, opts).child(id);
      return this._once(itemRef).then(function (currentVal) {
        if (!currentVal) {
          throw new Error('Not Found');
        }
        jsData.utils.deepMixIn(currentVal, props);
        return itemRef.set(currentVal);
      }).then(function () {
        return _this5._once(itemRef);
      }).then(function (record) {
        if (!record) {
          throw new Error('Not Found');
        }
        return [record, { ref: itemRef }];
      });
    },


    /**
     * Apply the given update to all records that match the selection query.
     * Internal method used by Adapter#updateAll.
     *
     * @name FirebaseAdapter#_updateAll
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {Object} props The update to apply to the selected records.
     * @param {Object} [query] Selection query.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _updateAll: function _updateAll(mapper, props, query, opts) {
      var _this6 = this;

      opts || (opts = {});
      props || (props = {});
      query || (query = {});

      return this._findAll(mapper, query, opts).then(function (results) {
        var _results2 = babelHelpers.slicedToArray(results, 1);

        var records = _results2[0];

        records.forEach(function (record) {
          return jsData.utils.deepMixIn(record, props);
        });
        return _this6._upsertBatch(mapper, records, opts);
      });
    },


    /**
     * Update the given records in a single batch. Internal method used by
     * Adapter#updateMany.
     *
     * @name FirebaseAdapter#updateMany
     * @method
     * @private
     * @param {Object} mapper The mapper.
     * @param {Object[]} records The records to update.
     * @param {Object} [opts] Configuration options.
     * @return {Promise}
     */
    _updateMany: function _updateMany(mapper, records, opts) {
      opts || (opts = {});
      return this._upsertBatch(mapper, records, opts);
    },
    getRef: function getRef(mapper, opts) {
      opts = opts || {};
      return this.baseRef.child(opts.endpoint || mapper.endpoint || mapper.name);
    },
    create: function create(mapper, props, opts) {
      var _this7 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.create.call(_this7, mapper, props, opts).then(success, failure);
        });
      });
    },
    createMany: function createMany(mapper, props, opts) {
      var _this8 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.createMany.call(_this8, mapper, props, opts).then(success, failure);
        });
      });
    },
    destroy: function destroy(mapper, id, opts) {
      var _this9 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.destroy.call(_this9, mapper, id, opts).then(success, failure);
        });
      });
    },
    destroyAll: function destroyAll(mapper, query, opts) {
      var _this10 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.destroyAll.call(_this10, mapper, query, opts).then(success, failure);
        });
      });
    },
    update: function update(mapper, id, props, opts) {
      var _this11 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.update.call(_this11, mapper, id, props, opts).then(success, failure);
        });
      });
    },
    updateAll: function updateAll(mapper, props, query, opts) {
      var _this12 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.updateAll.call(_this12, mapper, props, query, opts).then(success, failure);
        });
      });
    },
    updateMany: function updateMany(mapper, records, opts) {
      var _this13 = this;

      return createTask(function (success, failure) {
        queueTask(function () {
          __super__.updateMany.call(_this13, mapper, records, opts).then(success, failure);
        });
      });
    }
  });

  /**
   * Details of the current version of the `js-data-firebase` module.
   *
   * @name FirebaseAdapter.version
   * @type {Object}
   * @property {string} version.full The full semver value.
   * @property {number} version.major The major version number.
   * @property {number} version.minor The minor version number.
   * @property {number} version.patch The patch version number.
   * @property {(string|boolean)} version.alpha The alpha version value,
   * otherwise `false` if the current version is not alpha.
   * @property {(string|boolean)} version.beta The beta version value,
   * otherwise `false` if the current version is not beta.
   */

  var version = {
  beta: 1,
  full: '3.0.0-beta.1',
  major: 3,
  minor: 0,
  patch: 0
};

  exports.FirebaseAdapter = FirebaseAdapter;
  exports.version = version;
  exports['default'] = FirebaseAdapter;

}));
//# sourceMappingURL=js-data-firebase.js.map