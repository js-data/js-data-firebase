(function () {
  var firebaseAdapter = new FirebaseAdapter({
    firebaseUrl: 'https://js-data-firebase.firebaseio.com'
  });

  var datastore = new JSData.DS();
  datastore.defaults.defaultAdapter = 'firebaseAdapter';
  datastore.adapters.firebaseAdapter = firebaseAdapter;

  var User = datastore.defineResource('user');

  angular.module('firebase-example', [])
    .controller('firebaseCtrl', function ($scope) {
      $scope.add = function (user) {
        User.create(user);
      };
      $scope.remove = function (user) {
        User.destroy(user.id);
      };
      $scope.$watch(function () {
        return User.lastModified();
      }, function () {
        $scope.users = User.filter();
      });
    });
})();
