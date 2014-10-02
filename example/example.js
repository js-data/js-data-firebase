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
    .controller('firebaseCtrl', function ($scope, $timeout, User) {
      var fCtrl = this;
      User.findAll().then(function () {
        $scope.$apply();
      });

      $scope.add = function (user) {
        $scope.creating = true;
        User.create(user).then(function () {
          $scope.creating = false;
          fCtrl.name = '';
          $timeout();
        }, function () {
          $scope.creating = false;
        });
      };
      $scope.remove = function (user) {
        $scope.destroying = user.id;
        User.destroy(user.id).then(function () {
          delete $scope.destroying;
          $timeout();
        }, function () {
          delete $scope.destroying;
        });
      };
      $scope.$watch(function () {
        return User.lastModified();
      }, function () {
        $scope.users = User.filter();
      });
    });
})();
