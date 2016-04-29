import {DataStore} from 'js-data'
import {DSFirebaseAdapter} from 'js-data-firebase'

const store = new DataStore()
store.registerAdapter('firebase', new DSFirebaseAdapter({
  basePath: 'https://js-data-firebase-v3.firebaseio.com/'
}), { default: true })

store.defineMapper('user')
store.defineMapper('post')
store.defineMapper('comment')


store.create('user',{name:'hello'})
