##### 3.0.0-beta.2 - 18 May 2016

###### Breaking changes
- Now requires firebase 3.0.0 or greater
- The FirebaseAdapter constructor now takes just a "db" option

###### Bug fixes
- Officially works in Node.js now

##### 3.0.0-beta.1 - 03 May 2016

Official v3 beta release

###### Breaking changes
- Now depends on js-data v3
- How you must now import in ES2015:

    ```js
    import FirebaseAdapter from 'js-data-firebase'
    const adapter = new FirebaseAdapter({ basePath: '<your-firebase-url>' })
    ```
    or
    ```js
    import {FirebaseAdapter, version} from 'js-data-firebase'
    console.log(version)
    const adapter = new FirebaseAdapter()
    ```

- How you must now import in ES5:

    ```js
    var JSDataFirebase = require('js-data-firebase')
    var FirebaseAdapter = JSDataFirebase.FirebaseAdapter
    var adapter = new FirebaseAdapter({ basePath: '<your-firebase-url>' })
    ```

- Moved some `dist` files to `release` to reduce noise

###### Other
- Upgraded dependencies
- Improved JSDoc comments
- Now using js-data JSDoc template

##### 2.1.1 - 10 July 2015

###### Backwards compatible bug fixes
- fix for loading relations in find and findAll()

##### 2.1.0 - 10 July 2015

###### Backwards compatible API changes
- #15 - Add support for loading relations in find()
- #16 - Add support for loading relations in findAll()

##### 2.0.0 - 02 July 2015

Stable Version 2.0.0

##### 2.0.0-rc.1 - 27 June 2015

Stable Version 2.0.0-rc.1

##### 2.0.0-beta.1 - 18 April 2015

###### Backwards compatible bug fixes
- #11 - Race condition, tasks need to be atomic

###### Other
- Updated dependencies

##### 1.1.2 - 27 May 2015

###### Backwards compatible bug fixes
- #13 - Infinite loop

##### 1.1.1 - 27 March 2015

###### Backwards compatible bug fixes
- #9 - Race condition with missing IDs

##### 1.1.0 - 26 March 2015

###### Backwards compatible bug fixes
- #7 - Should not be saving relations (duplicating data)
- #8 - Need to use removeCircular

###### Other
- #6 - Convert to ES6

##### 1.0.1 - 25 February 2015

###### Backwards compatible bug fixes
- #4 - Does not properly throw error in find() (like other adapters) when the item cannot be found

##### 1.0.0 - 03 February 2015

Stable Version 1.0.0

##### 1.0.0-beta.1 - 10 January 2015

Now in beta.

###### Backwards compatible API changes
- #2 - Authentication

##### 1.0.0-alpha.1 - 01 November 2014

Stable Version 1.0.0-alpha.1

##### 0.4.3 - 18 October 2014

###### Backwards compatible bug fixes
- #1 - Create doesn't play well with idAttribute that isn't automatically assigned

##### 0.4.2 - 01 October 2014

###### Other
- Improved checking for dependencies

##### 0.4.1 - 28 September 2014

###### Backwards compatible bugfixes
- Corrected to use `resourceConfig.endpoint` rather than `resourceConfig.class`

##### 0.4.0 - 27 September 2014

###### Breaking API changes
- Refactored from `baseUrl` to `basePath`, as `baseUrl` doesn't make sense for all adapters, but `basePath` does

##### 0.1.0 - 16 September 2014

Initial release
