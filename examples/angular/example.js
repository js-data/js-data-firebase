angular.module('firebase-example', ['js-data'])
  .config(function (DSFirebaseAdapterProvider) {
    var basePath = 'https://js-data-firebase.firebaseio.com';
    DSFirebaseAdapterProvider.defaults.basePath = basePath;
  })
  .run(function (DS, DSFirebaseAdapter, User) {

    // js-data-angular created a new store
    // automatically and registered it as DS.
    // The firebase adapter was already registered,
    // but we want to make it the default.
    DS.registerAdapter(
      'firebase',
      DSFirebaseAdapter,
      { default: true }
    );

    // Activate a mostly auto-sync with Firebase
    // The only thing missing is auto-sync TO Firebase
    // This will be easier with js-data 2.x, but right
    // now you still have to do DS.update('user', 1, { foo: 'bar' }), etc.
    angular.forEach(DS.definitions, function (Resource) {
      var ref = DSFirebaseAdapter.ref.child(Resource.endpoint);
      // Inject items into the store when they're added to Firebase
      // Update items in the store when they're modified in Firebase
      ref.on('child_changed', function (dataSnapshot) {
        var data = dataSnapshot.val();
        if (data[Resource.idAttribute]) {
          Resource.inject(data);
        }
      });
      // Eject items from the store when they're removed from Firebase
      ref.on('child_removed', function (dataSnapshot) {
        var data = dataSnapshot.val();
        if (data[Resource.idAttribute]) {
          Resource.eject(data[Resource.idAttribute]);
        }
      });
    });
  })
  .service('User', function (DS, DSFirebaseAdapter) {
    return DS.defineResource('user');
  })
  .controller('firebaseCtrl', function ($scope, User) {
    var fCtrl = this;

    // Pull the initial list of users
    // from Firebase
    User.findAll();

    // Update the list of users on the
    // scope whenever the collection
    // changes
    User.bindAll({}, $scope, 'users');

    $scope.add = function (user) {
      // Create a new user in Firebase
      return User.create(user).then(function () {
        fCtrl.name = '';
      });
    };

    $scope.remove = function (user) {
      // Destroy a user from firebase
      return User.destroy(user.id);
    };
  });

hljs.initHighlightingOnLoad();
