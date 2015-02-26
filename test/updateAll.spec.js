describe('dsFirebaseAdapter#updateAll', function () {
  it('should update all users in firebase', function () {
    var id, id2, u, u2;
    return dsFirebaseAdapter.create(User, { name: 'John' })
      .then(function (user) {
        u = user;
        id = user.id;
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        return dsFirebaseAdapter.create(User, { name: 'Sally' });
      })
      .then(function (user) {
        u2 = user;
        id2 = user.id;
        assert.equal(user.name, 'Sally');
        assert.isString(user.id);
        return dsFirebaseAdapter.findAll(User);
      })
      .then(function (users) {
        assert.equal(users.length, 2);
        assert.deepEqual(JSON.stringify(users, null, 2), JSON.stringify([u, u2], null, 2));
        return dsFirebaseAdapter.updateAll(User, { age: 30 });
      })
      .then(function (users) {
        assert.equal(users.length, 2);
        assert.equal(users[0].age, 30);
        assert.equal(users[1].age, 30);
        return dsFirebaseAdapter.findAll(User);
      })
      .then(function (users) {
        assert.equal(users.length, 2);
        assert.equal(users[0].age, 30);
        assert.equal(users[1].age, 30);
      });
  });
});
