<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

# js-data-firebase

[![Slack][1]][2]
[![NPM][3]][4]
[![Tests][5]][6]
[![Downloads][7]][8]
[![Coverage][9]][10]

Tested on IE9, Chrome 46, Firefox 41 & Safari 7.1 using
<img src="https://raw.githubusercontent.com/js-data/js-data-firebase/master/bs.jpg" alt="bs logo" title="browserstack" width="150" height="35" style="vertical-align: middle" />

A Firebase adapter for the [JSData Node.js ORM][11].

### Installation

    npm install --save js-data js-data-firebase firebase

### Usage (Browser)

```js
import { FirebaseAdapter } from 'js-data-firebase';

window.firebase.initializeApp({
  apiKey: window.API_KEY,
  authDomain: window.AUTH_DOMAIN,
  databaseURL: window.DATABASE_URL
});

// Create an instance of FirebaseAdapter
const adapter = new FirebaseAdapter({
  // baseRef: 'users', // optionally set a baseRef root
  db: window.firebase.database()
});

// Other JSData setup hidden

// Register the adapter instance
store.registerAdapter('firebase', adapter, { default: true });
```

### Usage (Node.js)

```js
import firebase from 'firebase';
import { FirebaseAdapter } from 'js-data-firebase';

firebase.initializeApp({
  databaseURL: process.env.DATABASE_URL,
  serviceAccount: process.env.KEY_FILENAME || 'key.json'
});

// Create an instance of FirebaseAdapter
const adapter = new FirebaseAdapter({
  db: firebase.database()
});

// Other JSData setup hidden

// Register the adapter instance
store.registerAdapter('firebase', adapter, { default: true });
```

### JSData + Firebase Tutorial

Start with the [JSData + Firebase tutorial][12] or checkout the [API Reference Documentation][13].

### Need help?

Please [post a question][14] on Stack Overflow. **This is the preferred method.**

You can also chat with folks on the [Slack Channel][15]. If you end up getting
your question answered, please still consider consider posting your question to
Stack Overflow (then possibly answering it yourself). Thanks!

### Want to contribute?

Awesome! You can get started over at the [Contributing guide][16].

Thank you!

### License

[The MIT License (MIT)][17]

Copyright (c) 2014-2017 [js-data-firebase project authors][18]

[1]: http://slack.js-data.io/badge.svg
[2]: http://slack.js-data.io
[3]: https://img.shields.io/npm/v/js-data-firebase.svg?style=flat
[4]: https://www.npmjs.org/package/js-data-firebase
[5]: https://img.shields.io/circleci/project/js-data/js-data-firebase.svg?style=flat
[6]: https://circleci.com/gh/js-data/js-data-firebase
[7]: https://img.shields.io/npm/dm/js-data-firebase.svg?style=flat
[8]: https://www.npmjs.org/package/js-data-firebase
[9]: https://img.shields.io/codecov/c/github/js-data/js-data-firebase.svg?style=flat
[10]: https://codecov.io/github/js-data/js-data-firebase
[11]: http://www.js-data.io/
[12]: http://www.js-data.io/docs/js-data-firebase
[13]: http://api.js-data.io/js-data-firebase
[14]: http://stackoverflow.com/questions/tagged/jsdata
[15]: http://slack.js-data.io/
[16]: https://github.com/js-data/js-data-firebase/blob/master/.github/CONTRIBUTING.md
[17]: https://github.com/js-data/js-data-firebase/blob/master/LICENSE
[18]: https://github.com/js-data/js-data-firebase/blob/master/AUTHORS
