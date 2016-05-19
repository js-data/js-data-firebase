/*global assert:true */
'use strict'

// prepare environment for js-data-adapter-tests
var JSData = require('js-data')
var JSDataAdapterTests = require('./node_modules/js-data-adapter/dist/js-data-adapter-tests')
var JSDataFirebase = require('./')

var firebase = require('firebase')

firebase.initializeApp({
  databaseURL: 'https://js-data-firebase.firebaseio.com',
  serviceAccount: process.env.KEY_FILENAME || 'key.json'
})

var assert = global.assert = JSDataAdapterTests.assert
global.sinon = JSDataAdapterTests.sinon

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
