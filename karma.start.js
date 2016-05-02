/* global JSDataFirebase */

window.assert = JSDataAdapterTests.assert

JSDataAdapterTests.init({
  debug: false,
  JSData: JSData,
  Adapter: JSDataFirebase.FirebaseAdapter,
  adapterConfig: {
    debug: false,
    basePath: 'https://js-data-firebase-v3.firebaseio.com/'
  },
  // methods: [
  //   'afterCreate',
  //   'afterUpdate',
  //   'beforeCreate',
  //   'beforeUpdate',
  //   'count',
  //   'create',
  //   'createMany',
  //   'destroy',
  //   'destroyAll',
  //   'extend',
  //   'find',
  //   'findAll',
  //   'sum',
  //   'update',
  //   'updateAll',
  //   'updateMany'
  // ],
  // //js-data-firebase does NOT support these features
  xfeatures: [
    'findAllOpNotFound',
    'filterOnRelations'
  ]
})

describe('exports', function () {
  it('should have correct exports', function () {
    assert(JSDataFirebase)
    assert(JSDataFirebase.FirebaseAdapter)
    assert(JSDataFirebase.version)
  })
})
