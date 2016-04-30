/* global: localStorage */
const JSData = require('js-data')
const Adapter = require('js-data-adapter')
const guid = require('mout/random/guid')
const Firebase = require('firebase')

const {Query, utils} = JSData

function isValidString(value) {
  return (value != null && value !== '')
}

function join(items, separator) {
  separator || (separator = '')
  return items.filter(isValidString).join(separator)
}

function makePath(...args) {
  let result = join(args, '/')
  return result.replace(/([^:\/]|^)\/{2,}/g, '$1/')
}
let queue = []
let taskInProcess = false

function enqueue(task) {
  queue.push(task)
}

function dequeue() {
  if (queue.length && !taskInProcess) {
    taskInProcess = true
    queue[0]()
  }
}

function queueTask(task) {
  if (!queue.length) {
    enqueue(task)
    dequeue()
  } else {
    enqueue(task)
  }
}

function createTask(fn) {
  return new Promise(fn).then(function (result) {
    taskInProcess = false
    queue.shift()
    setTimeout(dequeue, 0)
    return result
  }, function (err) {
    taskInProcess = false
    queue.shift()
    setTimeout(dequeue, 0)
    return utils.reject(err)
  })
}

const __super__ = Adapter.prototype

const DEFAULTS = {
  /**
   * TODO
   *
   * @name DSFirebaseAdapter#basePath
   * @type {string}
   */
  basePath: '',

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#debug
   * @type {boolean}
   * @default false
   */
  debug: false,

  storage: localStorage
}

/**
 * DSFirebaseAdapter class.
 *
 * @example
 * import {DataStore} from 'js-data'
 * import DSFirebaseAdapter from 'js-data-localstorage'
 * const store = new DataStore()
 * const adapter = new DSFirebaseAdapter()
 * store.registerAdapter('firebase', adapter, { 'default': true })
 *
 * @class DSFirebaseAdapter
 * @param {Object} [opts] Configuration opts.
 * @param {string} [opts.basePath=''] TODO
 * @param {boolean} [opts.debug=false] TODO
 * @param {Object} [opts.storeage=localStorage] TODO
 */
function DSFirebaseAdapter(opts) {
  const self = this
  utils.classCallCheck(self, DSFirebaseAdapter)
  opts || (opts = {})
  utils.fillIn(opts, DEFAULTS)
  Adapter.call(self, opts)
  self.baseRef = new Firebase(opts.basePath || DEFAULTS.basePath)
}

// Setup prototype inheritance from Adapter
DSFirebaseAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value: DSFirebaseAdapter,
    enumerable: false,
    writable: true,
    configurable: true,
  }
})

Object.defineProperty(DSFirebaseAdapter, '__super__', {
  configurable: true,
  value: Adapter
})

/**
 * Alternative to ES6 class syntax for extending `DSFirebaseAdapter`.
 *
 * @name DSFirebaseAdapter.extend
 * @method
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the subclass.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the subclass itself.
 * @return {Object} Subclass of `DSFirebaseAdapter`.
 */
DSFirebaseAdapter.extend = utils.extend

utils.addHiddenPropsToTarget(DSFirebaseAdapter.prototype, {
  /**
   * Retrieve the number of records that match the selection query. Internal
   * method used by Adapter#count.
   *
   * @name DSFirebaseAdapter#_count
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _count(mapper, query, opts) {
    const self = this
    return self._findAll(mapper, query, opts).then(function (result) {
      result[0] = result[0].length
      return result
    })
  },

  /**
   * Create a new record. Internal method used by Adapter#create.
   *
   * @name DSFirebaseAdapter#_create
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create(mapper, props, opts) {
    const self = this
    props || (props = {})
    const _props = self._scrubProps(mapper, props);
    const id = utils.get(_props, mapper.idAttribute);

    if (utils.isString(id) || utils.isNumber()) {
      //return self._update(mapper, props, opts)
    }

    let collectionRef = self.getRef(mapper, opts)
    var newItemRef = collectionRef.push()

    utils.set(_props, mapper.idAttribute, newItemRef.key())
    return newItemRef.set(_props).then(() => {
      return newItemRef.once('value').then(dataSnapshot => {
        return [dataSnapshot.val(), newItemRef]
      })
    });
  },

  _scrubProps(mapper, props) {
    const self = this
    props || (props = {})
    const _props = {}
    const relationFields = mapper.relationFields || []
    utils.forOwn(props, function (value, key) {
      if (relationFields.indexOf(key) === -1) {
        _props[key] = value
      }
    })
    return _props;
  },

  /**
   * Upsert Helper used for updating or creating records in a single batch.
   *
   * @name DSFirebaseAdapter#_bulkUpsertHelper
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} records The records to be created or updated.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _bulkUpsertHelper(mapper, records, opts, mixin) {
    const self = this
    const atomicUpdates = {}
    const idAttribute = mapper.idAttribute
    const collectionRef = self.getRef(mapper, opts)
    const collectionUrl = collectionRef.toString().replace(self.baseRef.toString(), '')
    const updateMaps = []
    mixin || (mixin = {});

    //generate path for each
    records.forEach(record => {
      let _props = self._scrubProps(mapper, record)
      utils.deepMixIn(_props, mixin);

      var id = utils.get(_props, idAttribute)
      if (!id) {
        //get a new FB id
        let newItemRef = collectionRef.push()
        id = newItemRef.key()
        utils.set(_props, idAttribute, id)
      }
      //store in the update maps so we can re-map after the update.
      updateMaps.push({ original: record, scrubbed: _props })
      atomicUpdates[makePath(collectionUrl, id)] = _props
    })

    //do a deep-path update off the baseRef
    //see https://www.firebase.com/blog/2015-09-24-atomic-writes-and-more.html
    return self.baseRef.update(atomicUpdates).then(() => {
      //Use the stored update maps and mix in the id's.
      //todo Might query them all in order to get any UDF assigned values...
      updateMaps.forEach(updateMap => {
        utils.deepMixIn(updateMap.original, updateMap.scrubbed)
      })
      return [records, {}]
    })
  },

  /**
   * Create multiple records in a single batch. Internal method used by
   * Adapter#createMany.
   *
   * @name DSFirebaseAdapter#_createMany
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} records The records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany(mapper, records, opts) {
    //todo check or enforce upsert?
    return self._bulkUpsertHelper(mapper, records, opts)
  },

  /**
   * Destroy the record with the given primary key. Internal method used by
   * Adapter#destroy.
   *
   * @name DSFirebaseAdapter#_destroy
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroy(mapper, id, opts) {
    const self = this
    let ref = self.getRef(mapper, opts).child(id);
    return new Promise((resolve, reject) => {
      ref.remove(err => {
        return reject(err);
      })
      return resolve([undefined, ref]);
    })
  },

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @name DSFirebaseAdapter#_destroyAll
   * @method
   * @private
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroyAll(mapper, query, opts) {
    const self = this
    const collectionRef = self.getRef(mapper, opts)
    const collectionUrl = collectionRef.toString().replace(self.baseRef.toString(), '')
    const atomicUpdates = {};

    return self._findAll(mapper, query).then(results => {
      let [records] = results;
      records.forEach(record => {
        var id = utils.get(record, mapper.idAttribute)
        atomicUpdates[makePath(collectionUrl, id)] = null;
      })
      debugger;
      return self.baseRef.update(atomicUpdates).then(() => {
        return [undefined, {}];
      })
    })
  },

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @name DSFirebaseAdapter#_find
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _find(mapper, id, opts) {
    const self = this
    opts || (opts = {})
    let itemRef = self.getRef(mapper, opts).child(id)
    return itemRef.once('value').then(dataSnapshot => {
      return [dataSnapshot.val(), itemRef];
    })
  },
  /**
    * Retrieve the records that match the selection query. Internal method used
    * by Adapter#findAll.
    *
    * @name DSFirebaseAdapter#_findAll
    * @method
    * @private
    * @param {Object} mapper The mapper.
    * @param {Object} query Selection query.
    * @param {Object} [opts] Configuration options.
    * @return {Promise}
    */
  _findAll(mapper, query, opts) {
    const self = this
    query || (query = {})
    let collectionRef = self.getRef(mapper, opts);
    return collectionRef.once('value').then(dataSnapshot => {
      let data = dataSnapshot.val();
      if (!data) return [[], collectionRef];

      utils.forOwn(data, (value, key) => {
        if (!value[mapper.idAttribute]) {
          value[mapper.idAttribute] = `/${key}`;
        }
      })
      let items = Object.values(data)
      return [items, collectionRef];
    });
  },

  /**
   * Retrieve the number of records that match the selection query. Internal
   * method used by Adapter#sum.
   *
   * @name DSFirebaseAdapter#_sum
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {string} field The field to sum.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _sum(mapper, field, query, opts) {
    const self = this
    return self._findAll(mapper, query, opts).then(function (result) {
      let sum = 0
      result[0].forEach(function (record) {
        sum += utils.get(record, field) || 0
      })
      result[0] = sum
      return result
    })
  },

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @name DSFirebaseAdapter#_update
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _update(mapper, id, props, opts) {
    const self = this
    props || (props = {})
    const _props = self._scrubProps(mapper, props)

    let itemRef = self.getRef(mapper, opts).child(id)
    return itemRef.once('value').then(dataSnapshot => {
      let item = dataSnapshot.val()
      utils.deepMixIn(item, props)
      return itemRef.set(item).then(() => {
        return [item, itemRef]
      })
    });
  },

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @name DSFirebaseAdapter#_updateAll
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll(mapper, props, query, opts) {
    const self = this
    props || (props = {})
    return self._findAll(mapper, query, opts).then(records => {
      return self._bulkUpsertHelper(mapper, records, opts, props)
    })
  },

  /**
   * Update the given records in a single batch. Internal method used by
   * Adapter#updateMany.
   *
   * @name DSFirebaseAdapter#updateMany
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object[]} records The records to update.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateMany(mapper, records, opts) {
    return _bulkUpsertHelper(mapper, records, opts)
  },

  getRef(mapper, opts) {
    const self = this
    opts = opts || {}
    return self.baseRef.child(opts.endpoint || mapper.endpoint || mapper.name)
  },

  create(mapper, props, opts) {
    const self = this
    props || (props = {})
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.create.call(self, mapper, props, opts).then(success, failure)
      })
    })
  },

  createMany(mapper, props, opts) {
    const self = this
    props || (props = {})
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.createMany.call(self, mapper, props, opts).then(success, failure)
      })
    })
  },

  destroy(mapper, id, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.destroy.call(self, mapper, id, opts).then(success, failure)
      })
    })
  },

  destroyAll(mapper, query, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.destroyAll.call(self, mapper, query, opts).then(success, failure)
      })
    })
  },

  update(mapper, id, props, opts) {
    const self = this
    props || (props = {})
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.update.call(self, mapper, id, props, opts).then(success, failure)
      })
    })
  },

  updateAll(mapper, props, query, opts) {
    const self = this
    props || (props = {})
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.updateAll.call(self, mapper, props, query, opts).then(success, failure)
      })
    })
  },

  updateMany(mapper, records, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.updateMany.call(self, mapper, records, opts).then(success, failure)
      })
    })
  }
})




/**
 * Details of the current version of the `js-data-localstorage` module.
 *
 * @name DSFirebaseAdapter.version
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
DSFirebaseAdapter.version = {
  full: '<%= pkg.version %>',
  major: parseInt('<%= major %>', 10),
  minor: parseInt('<%= minor %>', 10),
  patch: parseInt('<%= patch %>', 10),
  alpha: '<%= alpha %>' !== 'false' ? '<%= alpha %>' : false,
  beta: '<%= beta %>' !== 'false' ? '<%= beta %>' : false
}

/**
 * Registered as `js-data-localstorage` in NPM and Bower.
 *
 * __Script tag__:
 * ```javascript
 * window.DSFirebaseAdapter
 * ```
 * __CommonJS__:
 * ```javascript
 * var DSFirebaseAdapter = require('js-data-localstorage')
 * ```
 * __ES6 Modules__:
 * ```javascript
 * import DSFirebaseAdapter from 'js-data-localstorage'
 * ```
 * __AMD__:
 * ```javascript
 * define('myApp', ['js-data-localstorage'], function (DSFirebaseAdapter) { ... })
 * ```
 *
 * @module js-data-localstorage
 */

module.exports = DSFirebaseAdapter
