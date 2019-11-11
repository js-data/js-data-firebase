import {Query, utils} from 'js-data'
import {Adapter} from '../node_modules/js-data-adapter/src/index'
import firebase from 'firebase'

function isValidString (value) {
  return (value != null && value !== '')
}

function join (items, separator) {
  separator || (separator = '')
  return items.filter(isValidString).join(separator)
}

function makePath (...args) { // eslint-disable-line no-unused-vars
  let result = join(args, '/')
  return result.replace(/([^:/]|^)\/{2,}/g, '$1/')
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
  return new utils.Promise(fn).then((result) => {
    taskInProcess = false
    queue.shift()
    setTimeout(dequeue, 0)
    return result
  }, (err) => {
    taskInProcess = false
    queue.shift()
    setTimeout(dequeue, 0)
    return utils.reject(err)
  })
}

const __super__ = Adapter.prototype

/**
 * FirebaseAdapter class.
 *
 * @example <caption>Browser</caption>
 * import {DataStore} from 'js-data'
 * import firebase from 'firebase'
 * import {FirebaseAdapter} from 'js-data-firebase'
 * const store = new DataStore()
 * firebase.initializeApp({
 *   apiKey: 'your-api-key',
 *   databaseURL: 'your-database-url'
 * })
 * const adapter = new FirebaseAdapter({ db: firebase.database() })
 * store.registerAdapter('firebase', adapter, { 'default': true })
 *
 * @example <caption>Node.js</caption>
 * import {Container} from 'js-data'
 * import firebase from 'firebase'
 * import {FirebaseAdapter} from 'js-data-firebase'
 * const store = new Container()
 * firebase.initializeApp({
 *   databaseURL: 'your-database-url',
 *   serviceAccount: 'path/to/keyfile'
 * })
 * const adapter = new FirebaseAdapter({ db: firebase.database() })
 * store.registerAdapter('firebase', adapter, { 'default': true })
 *
 * @class FirebaseAdapter
 * @param {Object} [opts] Configuration opts.
 * @param {Object} [opts.db] See {@link FirebaseAdapter#db}
 * @param {string} [opts.baseRef] See {@link FirebaseAdapter#baseRef}
 * @param {boolean} [opts.debug=false] See {@link Adapter#debug}.
 * @param {boolean} [opts.raw=false] See {@link Adapter#raw}.
 */
export function FirebaseAdapter (opts) {
  utils.classCallCheck(this, FirebaseAdapter)
  opts || (opts = {})
  Adapter.call(this, opts)

  /**
   * The database instance used by this adapter.
   *
   * @name FirebaseAdapter#db
   * @type {Object}
   * @default firebase.database()
   */
  if (opts.db) {
    this.db = opts.db || firebase.database()
    /**
     * The base ref to use as a root, e.g. `user/uid`
     *
     * @name FirebaseAdapter#baseRef
     * @type {string}
     * @default undefined
     */
    this.baseRef = opts.baseRef ? this.db.ref(opts.baseRef) : this.db.ref();
  }
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
    query || (query = {})
    opts || (opts = {})
    return this._findAll(mapper, query, opts).then((result) => {
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
    props || (props = {})
    opts || (opts = {})
    return this._upsert(mapper, props, opts)
  },

  _upsert (mapper, props, opts) {
    const _props = utils.plainCopy(props)
    opts || (opts = {})

    const id = utils.get(_props, mapper.idAttribute)
    const collectionRef = this.getRef(mapper, opts)

    let itemRef

    if (utils.isSorN(id)) {
      itemRef = collectionRef.child(id)
    } else {
      itemRef = collectionRef.push()
      utils.set(_props, mapper.idAttribute, itemRef.key)
    }

    return itemRef.set(_props)
      .then(() => this._once(itemRef))
      .then((record) => {
        if (!record) {
          throw new Error('Not Found')
        }
        return [record, { ref: itemRef }]
      })
  },

  _upsertBatch (mapper, records, opts) {
    opts || (opts = {})

    const idAttribute = mapper.idAttribute
    const refValueCollection = []
    const collectionRef = this.getRef(mapper, opts)

    // generate path for each
    records.forEach((record) => {
      const id = utils.get(record, idAttribute)
      let _props = utils.plainCopy(record)
      let itemRef

      if (utils.isSorN(id)) {
        itemRef = collectionRef.child(id)
      } else {
        itemRef = collectionRef.push()
        utils.set(_props, idAttribute, itemRef.key)
      }
      refValueCollection.push({ ref: itemRef, props: _props })
    })

    return this._atomicUpdate(mapper, refValueCollection, opts)
      .then(() => {
        // since UDFs and timestamps can alter values on write, let's get the latest values
        return utils.Promise.all(refValueCollection.map((item) => this._once(item.ref)))
      })
      .then((records) => {
        // just return the updated records and not the refs?
        return [records, { ref: refValueCollection.map((item) => item.ref) }]
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

  _atomicUpdate (mapper, refValueCollection, opts) { // collection of refs and the new value to set at that ref
    // do a deep-path update off the database
    // see https://www.firebase.com/blog/2015-09-24-atomic-writes-and-more.html
    let atomicUpdate = {}
    refValueCollection.forEach((item) => {
      atomicUpdate[item.ref.toString().replace(this.getRef(mapper, opts).toString(), '')] = item.props
    })
    return this.getRef(mapper, opts).update(atomicUpdate)
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
    opts || (opts = {})
    return this._upsertBatch(mapper, records, opts)
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
    opts || (opts = {})
    const ref = this.getRef(mapper, opts).child(id)
    return ref.remove().then(() => [undefined, { ref }])
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
    query || (query = {})
    opts || (opts = {})

    return this._findAll(mapper, query)
      .then((results) => {
        const [records] = results
        const idAttribute = mapper.idAttribute
        return utils.Promise.all(records.map((record) => {
          return this._destroy(mapper, utils.get(record, idAttribute), opts)
        }))
      })
      .then(() => [undefined, {}])
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
    opts || (opts = {})
    const itemRef = this.getRef(mapper, opts).child(id)
    return this._once(itemRef).then((record) => {
      if (!record) {
        record = undefined;
      }
      return [record, { ref: itemRef }]
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
    query || (query = {})
    opts || (opts = {})

    const collectionRef = this.getRef(mapper, opts)

    return collectionRef.once('value').then((dataSnapshot) => {
      const data = dataSnapshot.val()
      if (!data) {
        return [[], { ref: collectionRef }]
      }
      const records = []
      utils.forOwn(data, (value, key) => {
        records.push(value)
      })
      const _query = new Query({
        index: {
          getAll () {
            return records
          }
        }
      })
      return [_query.filter(query).run(), { ref: collectionRef }]
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
    return this._findAll(mapper, query, opts).then((result) => {
      result[0] = result[0].reduce((sum, record) => sum + (utils.get(record, field) || 0), 0)
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
   * @param {boolean} [opts.deepMerge] Disable deep merging with current value by passing `false`
   * @return {Promise}
   */
  _update (mapper, id, props, opts) {
    props || (props = {})
    opts || (opts = {})

    const itemRef = this.getRef(mapper, opts).child(id)
    return this._once(itemRef)
      .then((currentVal) => {
        if (!currentVal) {
          throw new Error('Not Found')
        }
        const newVal = opts.deepMerge !== false ? utils.deepMixIn(currentVal, props) : props
        return itemRef.set(newVal)
      })
      .then(() => this._once(itemRef))
      .then((record) => {
        if (!record) {
          throw new Error('Not Found')
        }
        return [record, { ref: itemRef }]
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
    opts || (opts = {})
    props || (props = {})
    query || (query = {})

    return this._findAll(mapper, query, opts).then((results) => {
      const [records] = results
      records.forEach((record) => utils.deepMixIn(record, props))
      return this._upsertBatch(mapper, records, opts)
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
    opts || (opts = {})
    return this._upsertBatch(mapper, records, opts)
  },

  getRef (mapper, opts) {
    opts = opts || {}
    return this.baseRef.child(opts.endpoint || mapper.endpoint || mapper.name)
  },

  create (mapper, props, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.create.call(this, mapper, props, opts).then(success, failure)
      })
    })
  },

  createMany (mapper, props, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.createMany.call(this, mapper, props, opts).then(success, failure)
      })
    })
  },

  destroy (mapper, id, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.destroy.call(this, mapper, id, opts).then(success, failure)
      })
    })
  },

  destroyAll (mapper, query, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.destroyAll.call(this, mapper, query, opts).then(success, failure)
      })
    })
  },

  update (mapper, id, props, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.update.call(this, mapper, id, props, opts).then(success, failure)
      })
    })
  },

  updateAll (mapper, props, query, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.updateAll.call(this, mapper, props, query, opts).then(success, failure)
      })
    })
  },

  updateMany (mapper, records, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.updateMany.call(this, mapper, records, opts).then(success, failure)
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
 * {@link FirebaseAdapter} class.
 *
 * @name module:js-data-firebase.FirebaseAdapter
 * @see FirebaseAdapter
 */

/**
 * Registered as `js-data-firebase` in NPM and Bower.
 *
 * @example <caption>Script tag</caption>
 * var FirebaseAdapter = window.JSDataFirebase.FirebaseAdapter
 * var adapter = new FirebaseAdapter()
 *
 * @example <caption>CommonJS</caption>
 * var FirebaseAdapter = require('js-data-firebase').FirebaseAdapter
 * var adapter = new FirebaseAdapter()
 *
 * @example <caption>ES2015 Modules</caption>
 * import {FirebaseAdapter} from 'js-data-firebase'
 * const adapter = new FirebaseAdapter()
 *
 * @example <caption>AMD</caption>
 * define('myApp', ['js-data-firebase'], function (JSDataFirebase) {
 *   var FirebaseAdapter = JSDataFirebase.FirebaseAdapter
 *   var adapter = new FirebaseAdapter()
 *
 *   // ...
 * })
 *
 * @module js-data-firebase
 */
