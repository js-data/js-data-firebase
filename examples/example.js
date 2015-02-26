(function () {
  angular.module('firebase-example', ['js-data'])
    .config(function (DSFirebaseAdapterProvider) {
      DSFirebaseAdapterProvider.defaults.basePath = 'https://js-data-firebase.firebaseio.com';
    })
    .run(function (DS, DSFirebaseAdapter) {
      // js-data-angular created a new store automatically and registered it as DS.
      // The firebase adapter was already registered, but we want to make it the default.
      DS.registerAdapter('firebase', DSFirebaseAdapter, { default: true });
    })
    .factory('User', function (DS) {
      return DS.defineResource('user');
    })
    .controller('firebaseCtrl', function ($scope, User) {
      var fCtrl = this;

      User.findAll().then(function () {
        $scope.users = User.filter();
      });

      User.bindAll({}, $scope, 'users');

      $scope.add = function (user) {
        return User.create(user).then(function () {
          fCtrl.name = '';
        });
      };

      $scope.remove = function (user) {
        return User.destroy(user.id);
      };
    });
})();
