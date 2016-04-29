/* global: localStorage */
const JSData = require('js-data')
const Adapter = require('js-data-adapter')
const guid = require('mout/random/guid')

const {
  Query,
  utils
} = JSData

function isValidString (value) {
  return (value != null && value !== '')
}
function join (items, separator) {
  separator || (separator = '')
  return items.filter(isValidString).join(separator)
}
function makePath (...args) {
  let result = join(args, '/')
  return result.replace(/([^:\/]|^)\/{2,}/g, '$1/')
}
let queue = []
let taskInProcess = false

function enqueue (task) {
  queue.push(task)
}

function dequeue () {
  if (queue.length && !taskInProcess) {
    taskInProcess = true
    queue[0]()
  }
}

function queueTask (task) {
  if (!queue.length) {
    enqueue(task)
    dequeue()
  } else {
    enqueue(task)
  }
}

function createTask (fn) {
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

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#storage
   * @type {Object}
   * @default localStorage
   */
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
 * store.registerAdapter('ls', adapter, { 'default': true })
 *
 * @class DSFirebaseAdapter
 * @param {Object} [opts] Configuration opts.
 * @param {string} [opts.basePath=''] TODO
 * @param {boolean} [opts.debug=false] TODO
 * @param {Object} [opts.storeage=localStorage] TODO
 */
function DSFirebaseAdapter (opts) {
  const self = this
  utils.classCallCheck(self, DSFirebaseAdapter)
  opts || (opts = {})
  utils.fillIn(opts, DEFAULTS)
  Adapter.call(self, opts)
}

// Setup prototype inheritance from Adapter
DSFirebaseAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value: DSFirebaseAdapter,
    enumerable: false,
    writable: true,
    configurable: true
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
  _count (mapper, query, opts) {
    const self = this
    return self._findAll(mapper, query, opts).then(function (result) {
      result[0] = result[0].length
      return result
    })
  },

  _createHelper (mapper, props, opts) {
    const self = this
    const _props = {}
    const relationFields = mapper.relationFields || []
    utils.forOwn(props, function (value, key) {
      if (relationFields.indexOf(key) === -1) {
        _props[key] = value
      }
    })
    const id = utils.get(_props, mapper.idAttribute) || guid()
    utils.set(_props, mapper.idAttribute, id)
    const key = self.getIdPath(mapper, opts, id)

    // Create the record
    // TODO: Create related records when the "with" option is provided
    self.storage.setItem(key, utils.toJson(_props))
    self.ensureId(id, mapper, opts)
    return utils.fromJson(self.storage.getItem(key))
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
  _create (mapper, props, opts) {
    const self = this
    return new Promise(function (resolve) {
      return resolve([self._createHelper(mapper, props, opts), {}])
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
   * @param {Object} props The records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany (mapper, props, opts) {
    const self = this
    return new Promise(function (resolve) {
      props || (props = [])
      return resolve([props.map(function (_props) {
        return self._createHelper(mapper, _props, opts)
      }), {}])
    })
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
  _destroy (mapper, id, opts) {
    const self = this
    return new Promise(function (resolve) {
      self.storage.removeItem(self.getIdPath(mapper, opts, id))
      self.removeId(id, mapper, opts)
      return resolve([undefined, {}])
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
  _destroyAll (mapper, query, opts) {
    const self = this
    return self._findAll(mapper, query).then(function (results) {
      let [records] = results
      const idAttribute = mapper.idAttribute
      // Gather IDs of records to be destroyed
      const ids = records.map(function (record) {
        return utils.get(record, idAttribute)
      })
      // Destroy each record
      ids.forEach(function (id) {
        self.storage.removeItem(self.getIdPath(mapper, opts, id))
      })
      self.removeId(ids, mapper, opts)
      return [undefined, {}]
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
  _find (mapper, id, opts) {
    const self = this
    return new Promise(function (resolve) {
      const key = self.getIdPath(mapper, opts, id)
      const record = self.storage.getItem(key)
      return resolve([record ? utils.fromJson(record) : undefined, {}])
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
  _findAll (mapper, query, opts) {
    const self = this
    query || (query = {})
    return new Promise(function (resolve) {
      // Load all records into memory...
      let records = []
      const ids = self.getIds(mapper, opts)
      utils.forOwn(ids, function (value, id) {
        const json = self.storage.getItem(self.getIdPath(mapper, opts, id))
        if (json) {
          records.push(utils.fromJson(json))
        }
      })
      const _query = new Query({
        index: {
          getAll () {
            return records
          }
        }
      })
      return resolve([_query.filter(query).run(), {}])
    })
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
  _sum (mapper, field, query, opts) {
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
  _update (mapper, id, props, opts) {
    const self = this
    props || (props = {})
    return new Promise(function (resolve, reject) {
      const key = self.getIdPath(mapper, opts, id)
      let record = self.storage.getItem(key)
      if (!record) {
        return reject(new Error('Not Found'))
      }
      record = utils.fromJson(record)
      utils.deepMixIn(record, props)
      self.storage.setItem(key, utils.toJson(record))
      return resolve([record, {}])
    })
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
  _updateAll (mapper, props, query, opts) {
    const self = this
    const idAttribute = mapper.idAttribute
    return self._findAll(mapper, query, opts).then(function (results) {
      let [records] = results
      records.forEach(function (record) {
        record || (record = {})
        const id = utils.get(record, idAttribute)
        const key = self.getIdPath(mapper, opts, id)
        utils.deepMixIn(record, props)
        self.storage.setItem(key, utils.toJson(record))
      })
      return [records, {}]
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
  _updateMany (mapper, records, opts) {
    const self = this
    records || (records = [])
    return new Promise(function (resolve) {
      const updatedRecords = []
      const idAttribute = mapper.idAttribute
      records.forEach(function (record) {
        if (!record) {
          return
        }
        const id = utils.get(record, idAttribute)
        if (utils.isUndefined(id)) {
          return
        }
        const key = self.getIdPath(mapper, opts, id)
        let json = self.storage.getItem(key)
        if (!json) {
          return
        }
        const existingRecord = utils.fromJson(json)
        utils.deepMixIn(existingRecord, record)
        self.storage.setItem(key, utils.toJson(existingRecord))
        updatedRecords.push(existingRecord)
      })
      return resolve([records, {}])
    })
  },

  create (mapper, props, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.create.call(self, mapper, props, opts).then(success, failure)
      })
    })
  },

  createMany (mapper, props, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.createMany.call(self, mapper, props, opts).then(success, failure)
      })
    })
  },

  destroy (mapper, id, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.destroy.call(self, mapper, id, opts).then(success, failure)
      })
    })
  },

  destroyAll (mapper, query, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.destroyAll.call(self, mapper, query, opts).then(success, failure)
      })
    })
  },

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#ensureId
   * @method
   */
  ensureId (id, mapper, opts) {
    const ids = this.getIds(mapper, opts)
    if (utils.isArray(id)) {
      if (!id.length) {
        return
      }
      id.forEach(function (_id) {
        ids[_id] = 1
      })
    } else {
      ids[id] = 1
    }
    this.saveKeys(ids, mapper, opts)
  },

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#getPath
   * @method
   */
  getPath (mapper, opts) {
    opts = opts || {}
    return makePath(opts.basePath === undefined ? (mapper.basePath === undefined ? this.basePath : mapper.basePath) : opts.basePath, mapper.name)
  },

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#getIdPath
   * @method
   */
  getIdPath (mapper, opts, id) {
    opts = opts || {}
    return makePath(opts.basePath || this.basePath || mapper.basePath, mapper.endpoint, id)
  },

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#getIds
   * @method
   */
  getIds (mapper, opts) {
    let ids
    const idsPath = this.getPath(mapper, opts)
    const idsJson = this.storage.getItem(idsPath)
    if (idsJson) {
      ids = utils.fromJson(idsJson)
    } else {
      ids = {}
    }
    return ids
  },

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#removeId
   * @method
   */
  removeId (id, mapper, opts) {
    const ids = this.getIds(mapper, opts)
    if (utils.isArray(id)) {
      if (!id.length) {
        return
      }
      id.forEach(function (_id) {
        delete ids[_id]
      })
    } else {
      delete ids[id]
    }
    this.saveKeys(ids, mapper, opts)
  },

  /**
   * TODO
   *
   * @name DSFirebaseAdapter#saveKeys
   * @method
   */
  saveKeys (ids, mapper, opts) {
    ids = ids || {}
    const idsPath = this.getPath(mapper, opts)
    if (Object.keys(ids).length) {
      this.storage.setItem(idsPath, utils.toJson(ids))
    } else {
      this.storage.removeItem(idsPath)
    }
  },

  update (mapper, id, props, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.update.call(self, mapper, id, props, opts).then(success, failure)
      })
    })
  },

  updateAll (mapper, props, query, opts) {
    const self = this
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.updateAll.call(self, mapper, props, query, opts).then(success, failure)
      })
    })
  },

  updateMany (mapper, records, opts) {
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
