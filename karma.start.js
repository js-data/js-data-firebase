// Setup global test variables
var dsFirebaseAdapter, store, Profile, User, Post, Comment;
assert.equalObjects = function (a, b, m) {
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m || 'Objects should be equal!');
};

// Helper globals
var fail = function (msg) {
  if (msg instanceof Error) {
    console.log(msg.stack);
  } else {
    assert.equal('should not reach this!: ' + msg, 'failure');
  }
};
var TYPES_EXCEPT_STRING = [123, 123.123, null, undefined, {}, [], true, false, function () {
}];
var TYPES_EXCEPT_STRING_OR_ARRAY = [123, 123.123, null, undefined, {}, true, false, function () {
}];
var TYPES_EXCEPT_STRING_OR_OBJECT = [123, 123.123, null, undefined, [], true, false, function () {
}];
var TYPES_EXCEPT_STRING_OR_NUMBER_OBJECT = [null, undefined, [], true, false, function () {
}];
var TYPES_EXCEPT_ARRAY = ['string', 123, 123.123, null, undefined, {}, true, false, function () {
}];
var TYPES_EXCEPT_STRING_OR_NUMBER = [null, undefined, {}, [], true, false, function () {
}];
var TYPES_EXCEPT_STRING_OR_ARRAY_OR_NUMBER = [null, undefined, {}, true, false, function () {
}];
var TYPES_EXCEPT_NUMBER = ['string', null, undefined, {}, [], true, false, function () {
}];
var TYPES_EXCEPT_OBJECT = ['string', 123, 123.123, null, undefined, true, false, function () {
}];
var TYPES_EXCEPT_BOOLEAN = ['string', 123, 123.123, null, undefined, {}, [], function () {
}];
var TYPES_EXCEPT_FUNCTION = ['string', 123, 123.123, null, undefined, {}, [], true, false];

// Setup before each test
beforeEach(function (done) {
  store = new JSData.DS();
  dsFirebaseAdapter = new DSFirebaseAdapter({
    basePath: 'https://js-data-firebase.firebaseio.com'
  });

  store.registerAdapter('DSFirebaseAdapter', dsFirebaseAdapter, {default: true});

  Profile = store.defineResource({
    name: 'profile'
  });
  User = store.defineResource({
    name: 'user',
    relations: {
      hasMany: {
        post: {
          localField: 'posts',
          foreignKey: 'post'
        }
      },
      hasOne: {
        profile: {
          localField: 'profile',
          localKey: 'profileId'
        }
      }
    }
  });
  Post = store.defineResource({
    name: 'post',
    relations: {
      belongsTo: {
        user: {
          localField: 'user',
          localKey: 'userId'
        }
      },
      hasMany: {
        comment: {
          localField: 'comments',
          foreignKey: 'postId'
        }
      }
    }
  });
  Comment = store.defineResource({
    name: 'comment',
    relations: {
      belongsTo: {
        post: {
          localField: 'post',
          localKey: 'postId'
        },
        user: {
          localField: 'user',
          localKey: 'userId'
        }
      }
    }
  });

  dsFirebaseAdapter.destroyAll(Profile).then(function () {
    return dsFirebaseAdapter.destroyAll(User);
  }).then(function () {
    return dsFirebaseAdapter.destroyAll(Post);
  }).then(function () {
    return dsFirebaseAdapter.destroyAll(Comment);
  }).then(function () {
    done();
  }).catch(done);
});

afterEach(function (done) {
  dsFirebaseAdapter.destroyAll(Profile).then(function () {
    return dsFirebaseAdapter.destroyAll(User);
  }).then(function () {
    return dsFirebaseAdapter.destroyAll(Post);
  }).then(function () {
    return dsFirebaseAdapter.destroyAll(Comment);
  }).then(function () {
    done();
  }).catch(done);
});
