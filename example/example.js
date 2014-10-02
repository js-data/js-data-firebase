(function () {
  angular.module('firebase-example', [])
    .factory('store', function () {
      var store = new JSData.DS();

      store.registerAdapter('firebase', new DSFirebaseAdapter({
        basePath: 'https://js-data-firebase.firebaseio.com'
      }), { default: true });

      return store;
    })
    .factory('User', function (store) {
      return store.defineResource('user');
    })
    .controller('firebaseCtrl', function ($scope, User) {
      var fCtrl = this;

      User.findAll().then(function (users) {
        $scope.users = users;
        $scope.$apply();
      });

      $scope.add = function (user) {
        User.create(user).then(function () {
          fCtrl.name = '';
          $scope.$apply();
        });
      };

      $scope.remove = function (user) {
        User.destroy(user.id).then(function () {
          $scope.$apply();
        });
      };
    });
})();
