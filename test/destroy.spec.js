describe('dsFirebaseAdapter#destroy', function () {
  it('should destroy a user from firebase', function (done) {
    var id;
    dsFirebaseAdapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user.id;
        return dsFirebaseAdapter.destroy(User, user.id);
      })
      .then(function () {
        return dsFirebaseAdapter.find(User, id);
      })
      .then(function (destroyedUser) {
        assert.isFalse(!!destroyedUser);
        done();
      })
      .catch(done);
  });
});
