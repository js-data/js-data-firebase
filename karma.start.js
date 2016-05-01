// Setup before each test
// beforeEach(function (done) {
//   store = new JSData.DS();
//   dsFirebaseAdapter = new DSFirebaseAdapter({
//     basePath: 'https://js-data-firebase.firebaseio.com'
//   });

window.assert = JSDataAdapterTests.assert

JSDataAdapterTests.init({
  debug: true,
  JSData: JSData,
  Adapter: DSFirebaseAdapter,
  adapterConfig: {
    debug: false,
    basePath: 'https://js-data-firebase-v3.firebaseio.com/'
  },
  methods: [
    'afterCreate',
    // 'afterUpdate',
    // 'beforeCreate',
    // 'beforeUpdate',
    // 'count',
    // 'create',
    // 'createMany',
    // 'destroy',
    // 'destroyAll',
    // 'extend',
    // 'find',
    // 'findAll',
    // 'sum',
    // 'update',
    // 'updateAll',
    // 'updateMany'
  ],
  // //js-data-firebase does NOT support these features
  xfeatures: [
    // 'findAllOpNotFound',
    // 'filterOnRelations'
  ]
})
