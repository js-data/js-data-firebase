(function () {
  var firebaseAdapter = new FirebaseAdapter({
    firebaseUrl: 'https://js-data-firebase.firebaseio.com'
  });

  var datastore = new JSData.DS();
  datastore.defaults.defaultAdapter = 'firebaseAdapter';
  datastore.adapters.firebaseAdapter = firebaseAdapter;

  var User = datastore.defineResource('user');

  angular.module('firebase-example', [])
    .controller('firebaseCtrl', function ($scope, $timeout) {
      $scope.add = function (user) {
        $scope.creating = true;
        User.create(user).then(function () {
          $scope.creating = false;
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
        });
      };
      $scope.$watch(function () {
        return User.lastModified();
      }, function () {
        $scope.users = User.filter();
      });
    });
})();
