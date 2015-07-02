var store = new JSData.DS();
var firebaseAdapter = new DSFirebaseAdapter({
  basePath: 'https://js-data-firebase.firebaseio.com'
});

store.registerAdapter('firebase', firebaseAdapter, { default: true });

// Flux pattern
var UserStore = store.defineResource({
  name: 'user',
  afterInject: function () {
    UserStore.emit('change');
  },
  afterEject: function () {
    UserStore.emit('change');
  }
});

// Activate a mostly auto-sync with Firebase
// The only thing missing is auto-sync TO Firebase
// This will be easier with js-data 2.x, but right
// now you still have to do store.update('user', 1, { foo: 'bar' }), etc.
for (var resourceName in store.definitions) {
  var Resource = store.definitions[resourceName];
  var ref = firebaseAdapter.ref.child(Resource.endpoint);
  // Inject items into the store when they're added to Firebase
  // Update items in the store when they're modified in Firebase
  ref.on('child_changed', function (dataSnapshot) {
    var data = dataSnapshot.val();
    if (data[Resource.idAttribute]) {
      Resource.inject(data);
    }
  });
  // Eject items from the store when they're removed from Firebase
  ref.on('child_removed', function (dataSnapshot) {
    var data = dataSnapshot.val();
    if (data[Resource.idAttribute]) {
      Resource.eject(data[Resource.idAttribute]);
    }
  });
};

var UserItem = React.createClass({
  remove: function () {
    UserStore.destroy(this.props.user.id);
  },
  render: function () {
    var user = this.props.user;
    return <div className="list-group-item" key={user.id}>
      <div className="pull-right">
        <button className="btn btn-xs btn-danger" onClick={this.remove}>
        Delete
        </button>
      </div>
      {user.name}
    </div>;
  }
});

var UserApp = React.createClass({
  getInitialState: function () {
    // Pull the initial list of users
    // from Firebase
    UserStore.findAll();

    return { users: UserStore.getAll(), name: '' };
  },
  onChange: function () {
    this.setState({ users: UserStore.getAll() });
  },
  onInput: function (event) {
    this.setState({ name: event.target.value });
  },
  componentDidMount: function () {
    UserStore.on('change', this.onChange);
  },
  componentWillUnmount: function () {
    UserStore.off('change', this.onChange);
  },
  createUser: function (e) {
    var _this = this;
    e.preventDefault();
    UserStore.create({
      name: _this.state.name
    }).then(function () {
      _this.setState({ name: '' });
    });
  },
  render: function () {
    var users = this.state.users;
    var _userItems = [];

    users.forEach(function (user, i) {
      _userItems.push(<UserItem key={i} user={users[i]} />);
    });

    return (
      <div className="panel panel-primary">
        <div className="panel-heading">
          <h3 className="panel-title">Users</h3>
        </div>
        <div className="list-group">
          {_userItems}
          <div className="list-group-item">
            <form id="user-form" name="user-form" className="list-group-item" onSubmit={this.createUser}>
              <input className="form-control" type="text" id="name" name="name" value={this.state.name} onChange={this.onInput} placeholder="Enter a name and press enter" />
              <input type="submit" className="hidden"/>
            </form>
          </div>
        </div>
      </div>
    );
  }
});

React.render(<UserApp />, document.getElementById('example'));

hljs.initHighlightingOnLoad();
