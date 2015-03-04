var store = new JSData.DS();

store.registerAdapter(
  'firebase',
  new DSFirebaseAdapter({
    basePath: 'https://js-data-firebase.firebaseio.com'
  }),
  { default: true }
);

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
    this.setState({ users: UserStore.getAll(), name: this.props.name || '' });
  },
  onInput: function (event) {
    this.setState({ users: this.state.users, name: event.target.value });
  },
  componentDidMount: function () {
    UserStore.on('change', this.onChange);
  },
  componentWillUnmount: function () {
    UserStore.off('change', this.onChange);
  },
  createUser: function (e) {
    e.preventDefault();
    UserStore.create({
      name: this.state.name
    });
    this.setState({ users: UserStore.getAll(), name: '' });
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
