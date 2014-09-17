describe('firebaseAdapter#destroy', function () {
  it('should destroy a user from firebase', function (done) {
    var id;
    firebaseAdapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user.id;
        return firebaseAdapter.destroy(User, user.id);
      })
      .then(function () {
        return firebaseAdapter.find(User, id);
      })
      .then(function (destroyedUser) {
        assert.isFalse(!!destroyedUser);
        done();
      })
      .catch(done);
  });
});
