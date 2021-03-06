/* global JSDataFirebase, firebase */

window.assert = JSDataAdapterTests.assert

firebase.initializeApp({
  apiKey: window.API_KEY,
  authDomain: window.AUTH_DOMAIN,
  databaseURL: window.DATABASE_URL
})

JSDataAdapterTests.init({
  debug: false,
  JSData: JSData,
  Adapter: JSDataFirebase.FirebaseAdapter,
  adapterConfig: {
    debug: false,
    db: firebase.database()
  },
  // js-data-firebase does NOT support these features
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
