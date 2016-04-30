
const store = new JSData.DataStore();

store.registerAdapter('firebase', new DSFirebaseAdapter({
  basePath: 'https://js-data-firebase-v3.firebaseio.com/'
}), { default: true })

store.defineMapper('user')
// store.defineMapper('post')
// store.defineMapper('comment')

// store.find('user', "-KGZmhcrn49qWj6vTS2M").then(found => {
//   console.log(found);
// })

// store.create('user', { name: 'hello' }).then(user => {
//   console.log(user)
//   user.name = "Pizza"
//   store.update('user', user.id, user).then(updated => {
//     console.log(updated)
//   });
// })


store.createMany('user', [{ name: "sam" }, { name: "john" }, { name: "peter" }, { name: "bob" }, { id: "123456", name: "joe" }])