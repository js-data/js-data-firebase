describe('dsFirebaseAdapter#findAll', function () {
  it('should find all the users in firebase', function () {
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
      });
  });
  it('should load belongsTo relations', function () {
    return dsFirebaseAdapter.create(Profile, {
      email: 'foo@test.com'
    }).then(function (profile) {
      return Promise.all([
        dsFirebaseAdapter.create(User, {name: 'John', profileId: profile.id}).then(function (user) {
          return dsFirebaseAdapter.create(Post, {content: 'foo', userId: user.id});
        }),
        dsFirebaseAdapter.create(User, {name: 'Sally'}).then(function (user) {
          return dsFirebaseAdapter.create(Post, {content: 'bar', userId: user.id});
        })
      ])
    })
      .spread(function (post1, post2) {
        return Promise.all([
          dsFirebaseAdapter.create(Comment, {
            content: 'test2',
            postId: post1.id,
            userId: post1.userId
          }),
          dsFirebaseAdapter.create(Comment, {
            content: 'test3',
            postId: post2.id,
            userId: post2.userId
          })
        ]);
      })
      .then(function () {
        return dsFirebaseAdapter.findAll(Comment, {}, {'with': ['post', 'post.user', 'user', 'user.profile']});
      })
      .then(function (comments) {
        assert.isDefined(comments[0].post);
        assert.isDefined(comments[0].post.user);
        assert.isDefined(comments[0].user);
        assert.isDefined(comments[0].user.profile || comments[1].user.profile);
        assert.isDefined(comments[1].post);
        assert.isDefined(comments[1].post.user);
        assert.isDefined(comments[1].user);
      })
      .catch(function (err) {
        console.log(err.stack);
        throw err;
      });
  });
  it('should load hasMany and belongsTo relations', function () {
    return dsFirebaseAdapter.create(Profile, {
      email: 'foo@test.com'
    }).then(function (profile) {
      return Promise.all([
        dsFirebaseAdapter.create(User, {name: 'John', profileId: profile.id}).then(function (user) {
          return dsFirebaseAdapter.create(Post, {content: 'foo', userId: user.id});
        }),
        dsFirebaseAdapter.create(User, {name: 'Sally'}).then(function (user) {
          return dsFirebaseAdapter.create(Post, {content: 'bar', userId: user.id});
        })
      ]);
    })
      .spread(function (post1, post2) {
        return Promise.all([
          dsFirebaseAdapter.create(Comment, {
            content: 'test2',
            postId: post1.id,
            userId: post1.userId
          }),
          dsFirebaseAdapter.create(Comment, {
            content: 'test3',
            postId: post2.id,
            userId: post2.userId
          })
        ]);
      })
      .then(function () {
        return dsFirebaseAdapter.findAll(Post, {}, {'with': ['user', 'comment', 'comment.user', 'comment.user.profile']});
      })
      .then(function (posts) {
        assert.isDefined(posts[0].comments);
        assert.isDefined(posts[0].comments[0].user);
        assert.isDefined(posts[0].comments[0].user.profile || posts[1].comments[0].user.profile);
        assert.isDefined(posts[0].user);
        assert.isDefined(posts[1].comments);
        assert.isDefined(posts[1].comments[0].user);
        assert.isDefined(posts[1].user);
      });
  });
});
