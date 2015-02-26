describe('dsFirebaseAdapter#destroy', function () {
  it('should destroy a user from firebase', function () {
    var id;
    return dsFirebaseAdapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user.id;
        return dsFirebaseAdapter.destroy(User, user.id);
      })
      .then(function () {
        return dsFirebaseAdapter.find(User, id);
      })
      .then(function () {
        throw new Error('Should not have reached this!');
      })
      .catch(function (err) {
        assert.equal(err.message, 'Not Found!');
      });
  });
});
