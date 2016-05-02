import { Query, utils } from 'js-data'
import { Adapter } from '../node_modules/js-data-adapter/src/index'
import Firebase from 'firebase' // Help?

function isValidString (value) {
  return (value != null && value !== '')
}

function join (items, separator) {
  separator || (separator = '')
  return items.filter(isValidString).join(separator)
}

function makePath (...args) { // eslint-disable-line no-unused-vars
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
   * @name FirebaseAdapter#basePath
   * @type {string}
   */
  basePath: 'https://docs-examples.firebaseio.com/samplechat',

  /**
   * TODO
   *
   * @name FirebaseAdapter#debug
   * @type {boolean}
   * @default false
   */
  debug: false
}

/**
 * FirebaseAdapter class.
 *
 * @example
 * import {DataStore} from 'js-data'
 * import FirebaseAdapter from 'js-data-firebase'
 * const store = new DataStore()
 * const adapter = new FirebaseAdapter()
 * store.registerAdapter('firebase', adapter, { 'default': true })
 *
 * @class FirebaseAdapter
 * @param {Object} [opts] Configuration opts.
 * @param {string} [opts.basePath=''] TODO
 * @param {boolean} [opts.debug=false] TODO
 */
export function FirebaseAdapter (opts) {
  const self = this
  utils.classCallCheck(self, FirebaseAdapter)
  opts || (opts = {})
  utils.fillIn(opts, DEFAULTS)
  Adapter.call(self, opts)

  /**
   * The ref instance used by this adapter. Use this directly when you
   * need to write custom queries.
   *
   * @name FirebaseAdapter#baseRef
   * @type {Object}
   */
  self.baseRef = opts.baseRef || new Firebase(opts.basePath)
}

// Setup prototype inheritance from Adapter
FirebaseAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value: FirebaseAdapter,
    enumerable: false,
    writable: true,
    configurable: true
  }
})

Object.defineProperty(FirebaseAdapter, '__super__', {
  configurable: true,
  value: Adapter
})

/**
 * Alternative to ES6 class syntax for extending `FirebaseAdapter`.
 *
 * @name FirebaseAdapter.extend
 * @method
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the subclass.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the subclass itself.
 * @return {Object} Subclass of `FirebaseAdapter`.
 */
FirebaseAdapter.extend = utils.extend

utils.addHiddenPropsToTarget(FirebaseAdapter.prototype, {
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
  _count (mapper, query, opts) {
    const self = this
    opts || (opts = {})
    query || (query = {})

    return self._findAll(mapper, query, opts).then(function (result) {
      result[0] = result[0].length
      return result
    })
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
  _create (mapper, props, opts) {
    const self = this
    props || (props = {})
    opts || (opts = {})
    return self._upsert(mapper, props, opts)
  },

  _upsert (mapper, props, opts) {
    const self = this
    const _props = utils.copy(props)
    opts || (opts = {})

    const id = utils.get(_props, mapper.idAttribute)
    const collectionRef = self.getRef(mapper, opts)

    let itemRef

    if (utils.isString(id) || utils.isNumber(id)) {
      itemRef = collectionRef.child(id)
    } else {
      itemRef = collectionRef.push()
      utils.set(_props, mapper.idAttribute, itemRef.key())
    }

    return itemRef.set(_props).then(() => {
      return self._once(itemRef).then((record) => {
        if (!record) {
          throw new Error('Not Found')
        }
        return [record, itemRef]
      })
    })
  },

  _upsertBatch (mapper, records, opts) {
    const self = this
    opts || (opts = {})

    const refValueCollection = []
    const collectionRef = self.getRef(mapper, opts)

    // generate path for each
    records.forEach((record) => {
      const id = utils.get(record, mapper.idAttribute)
      let _props = utils.copy(record)
      let itemRef

      if (utils.isString(id) || utils.isNumber(id)) {
        itemRef = collectionRef.child(id)
      } else {
        itemRef = collectionRef.push()
        utils.set(_props, mapper.idAttribute, itemRef.key())
      }
      refValueCollection.push({ ref: itemRef, props: _props })
    })

    return self._atomicUpdate(refValueCollection).then(() => {
      // since UDFs and timestamps can alter values on write, let's get the latest values
      return utils.Promise.all(refValueCollection.map((item) => {
        return self._once(item.ref).then((record) => {
          return [record, item.ref]
        })
      })).then(() => {
        // just return the updated records and not the refs?
        return [refValueCollection.map((item) => item.props), refValueCollection]
      })
    })
  },

  _once (ref) {
    return ref.once('value').then((dataSnapshot) => {
      if (!dataSnapshot.exists()) {
        return null
      }
      return dataSnapshot.val()
    })
  },

  _atomicUpdate (refValueCollection) { // collection of refs and the new value to set at that ref
    const self = this
    // do a deep-path update off the baseRef
    // see https://www.firebase.com/blog/2015-09-24-atomic-writes-and-more.html
    let atomicUpdate = {}
    refValueCollection.forEach((item) => {
      atomicUpdate[item.ref.toString().replace(self.baseRef.toString(), '')] = item.props
    })
    return self.baseRef.update(atomicUpdate)
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
  _createMany (mapper, records, opts) {
    // todo check or enforce upsert?
    const self = this
    opts || (opts = {})

    return self._upsertBatch(mapper, records, opts)
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
  _destroy (mapper, id, opts) {
    const self = this
    opts || (opts = {})
    let ref = self.getRef(mapper, opts).child(id)

    return ref.remove().then(() => {
      return [undefined, ref]
    })
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
  _destroyAll (mapper, query, opts) {
    const self = this
    opts || (opts = {})
    query || (query = {})

    return self._findAll(mapper, query).then((results) => {
      let [records] = results
      return utils.Promise.all(records.map((record) => {
        const id = utils.get(record, mapper.idAttribute)
        return self._destroy(mapper, id, opts)
      })).then(() => {
        return [undefined, {}]
      })
    })
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
  _find (mapper, id, opts) {
    const self = this
    opts || (opts = {})

    let itemRef = self.getRef(mapper, opts).child(id)
    return self._once(itemRef).then((record) => {
      return [record, itemRef]
    })
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
  _findAll (mapper, query, opts) {
    const self = this
    opts || (opts = {})
    query || (query = {})

    let collectionRef = self.getRef(mapper, opts)

    return collectionRef.once('value').then((dataSnapshot) => {
      let data = dataSnapshot.val()
      if (!data) return [[], collectionRef]

      let records = Object.values(data)
      const _query = new Query({
        index: {
          getAll () {
            return records
          }
        }
      })
      var filtered = _query.filter(query).run()
      console.info(records, query, filtered)
      return [filtered, collectionRef]
    })
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
  _sum (mapper, field, query, opts) {
    const self = this
    opts || (opts = {})
    query || (query = {})

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
   * @name FirebaseAdapter#_update
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
    opts || (opts = {})

    let itemRef = self.getRef(mapper, opts).child(id)
    return self._once(itemRef).then((currentVal) => {
      if (!currentVal) {
        throw new Error('Not Found')
      }
      utils.deepMixIn(currentVal, props)
      return itemRef.set(currentVal).then(() => {
        return self._once(itemRef).then((record) => {
          if (!record) {
            throw new Error('Not Found')
          }
          return [record, itemRef]
        })
      })
    })
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
  _updateAll (mapper, props, query, opts) {
    const self = this
    opts || (opts = {})
    props || (props = {})
    query || (query = {})

    return self._findAll(mapper, query, opts).then((results) => {
      let [records] = results
      records = records.map((record) => utils.deepMixIn(record, props))
      return self._upsertBatch(mapper, records, opts)
    })
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
  _updateMany (mapper, records, opts) {
    const self = this
    opts || (opts = {})

    return self._upsertBatch(mapper, records, opts)
  },

  getRef (mapper, opts) {
    const self = this
    opts = opts || {}
    return self.baseRef.child(opts.endpoint || mapper.endpoint || mapper.name)
  },

  create (mapper, props, opts) {
    const self = this
    props || (props = {})
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.create.call(self, mapper, props, opts).then(success, failure)
      })
    })
  },

  createMany (mapper, props, opts) {
    const self = this
    props || (props = {})
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

  update (mapper, id, props, opts) {
    const self = this
    props || (props = {})
    return createTask(function (success, failure) {
      queueTask(function () {
        __super__.update.call(self, mapper, id, props, opts).then(success, failure)
      })
    })
  },

  updateAll (mapper, props, query, opts) {
    const self = this
    props || (props = {})
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

export const version = '<%= version %>'

/**
 * Registered as `js-data-firebase` in NPM and Bower.
 *
 * __Script tag__:
 * ```javascript
 * window.FirebaseAdapter
 * ```
 * __CommonJS__:
 * ```javascript
 * var FirebaseAdapter = require('js-data-firebase')
 * ```
 * __ES6 Modules__:
 * ```javascript
 * import FirebaseAdapter from 'js-data-firebase'
 * ```
 * __AMD__:
 * ```javascript
 * define('myApp', ['js-data-firebase'], function (FirebaseAdapter) { ... })
 * ```
 *
 * @module js-data-firebase
 */

export default FirebaseAdapter
