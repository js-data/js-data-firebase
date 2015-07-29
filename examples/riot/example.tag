<example>
  <div class="panel panel-primary">
    <div class="panel-heading">
      <h3 class="panel-title">Users</h3>
    </div>
    <div class="list-group">
      <div each={ users } class="list-group-item" key={ id }>
        <div class="pull-right">
          <button class="btn btn-xs btn-danger" onClick={ parent.removeUser }>
          Delete
          </button>
        </div>
        { name }
      </div>
      <div class="list-group-item">
        <form id="user-form" name="user-form" class="list-group-item" onSubmit={ createUser }>
          <input class="form-control" type="text" name="userNameInput" onKeyUp={ edit }
                 placeholder="Enter a name and press enter" />
        </form>
      </div>
    </div>
  </div>

  <script>
  var self = this
  self.userNameToAdd = ''
  var store = new JSData.DS()
  var firebaseAdapter = new DSFirebaseAdapter({
    basePath: 'https://js-data-firebase.firebaseio.com'
  })
  store.registerAdapter('firebase', firebaseAdapter, { default: true })

  var UserStore = store.defineResource({
    name: 'user',
    afterInject: function () {
      UserStore.emit('change')
    },
    afterEject: function () {
      UserStore.emit('change')
    }
  })

  for (var resourceName in store.definitions) {
    var Resource = store.definitions[resourceName]
    var ref = firebaseAdapter.ref.child(Resource.endpoint)
    // Inject items into the store when they're added to Firebase
    // Update items in the store when they're modified in Firebase
    ref.on('child_changed', function (dataSnapshot) {
      var data = dataSnapshot.val()
      if (data[Resource.idAttribute]) {
        Resource.inject(data)
      }
    })
    // Eject items from the store when they're removed from Firebase
    ref.on('child_removed', function (dataSnapshot) {
      var data = dataSnapshot.val()
      if (data[Resource.idAttribute]) {
        Resource.eject(data[Resource.idAttribute])
      }
    })
  }

  UserStore.on('change', function() {
    self.users = UserStore.getAll()
    self.update()
  })

  self.on('mount', function() {
    // Pull the initial list of users from Firebase
    UserStore.findAll()
  })

  edit(e) {
    self.userNameToAdd = e.target.value
  }

  createUser() {
    if (self.userNameToAdd) {
      UserStore.create({ name: self.userNameToAdd }).then(function () {
        self.userNameToAdd = self.userNameInput.value = ''
      })
    }
  }

  removeUser(e) {
    UserStore.destroy(e.item.id)
  }
  </script>
</example>
