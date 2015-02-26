describe('dsFirebaseAdapter#create', function () {
  it('should create a user in firebase', function () {
    var id;
    return dsFirebaseAdapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user.id;
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        return dsFirebaseAdapter.find(User, user.id);
      })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        assert.deepEqual(user, { id: id, name: 'John' });
      });
  });
  it('should create a user in firebase with a provided primary key', function () {
    var id = 'test-' + (new Date().getTime());
    return dsFirebaseAdapter.create(User, { id: id, name: 'John' })
      .then(function (user) {
        assert.equal(user.id, id);
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        return dsFirebaseAdapter.find(User, user.id);
      })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        assert.deepEqual(user, { id: id, name: 'John' });
      });
  });
});
