angular.module('firebase-example', ['js-data'])
  .config(function (DSFirebaseAdapterProvider) {
    var basePath = 'https://js-data-firebase.firebaseio.com';
    DSFirebaseAdapterProvider.defaults.basePath = basePath;
  })
  .run(function (DS, DSFirebaseAdapter) {

    // js-data-angular created a new store
    // automatically and registered it as DS.
    // The firebase adapter was already registered,
    // but we want to make it the default.
    DS.registerAdapter(
      'firebase',
      DSFirebaseAdapter,
      { default: true }
    );
  })
  .factory('User', function (DS) {
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
