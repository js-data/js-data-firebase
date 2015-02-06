(function () {
  angular.module('firebase-example', ['js-data'])
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
