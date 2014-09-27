(function () {
  var dsFirebaseAdapter = new DSFirebaseAdapter({
    basePath: 'https://js-data-firebase.firebaseio.com'
  });

  var datastore = new JSData.DS();
  datastore.registerAdapter('DSFirebaseAdapter', dsFirebaseAdapter, { default: true });

  var User = datastore.defineResource('user');

  angular.module('firebase-example', [])
    .controller('firebaseCtrl', function ($scope, $timeout) {
      var fCtrl = this;

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
