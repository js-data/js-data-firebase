import JSData from 'js-data';
import Firebase from 'firebase';
import omit from 'mout/object/omit';
import values from 'mout/object/values';

let emptyStore = new JSData.DS();
let DSUtils = JSData.DSUtils;
let { deepMixIn, removeCircular, forOwn  } = DSUtils;
let filter = emptyStore.defaults.defaultFilter;

class Defaults {

}

Defaults.prototype.basePath = '';

let queue = [];
let taskInProcess = false;

function enqueue(task) {
  queue.push(task);
}

function dequeue() {
  if (queue.length && !taskInProcess) {
    taskInProcess = true;
    queue[0]();
  }
}

function queueTask(task) {
  if (!queue.length) {
    enqueue(task);
    dequeue();
  } else {
    enqueue(task);
  }
}

function createTask(fn) {
  return new DSUtils.Promise(fn).then(result => {
    taskInProcess = false;
    queue.shift();
    setTimeout(dequeue, 0);
    return result;
  }, err => {
    taskInProcess = false;
    queue.shift();
    setTimeout(dequeue, 0);
    return DSUtils.Promise.reject(err);
  });
}

class DSFirebaseAdapter {
  constructor(options) {
    options = options || {};
    this.defaults = new Defaults();
    deepMixIn(this.defaults, options);
    this.ref = new Firebase(options.basePath || this.defaults.basePath);
  }

  getRef(resourceConfig, options) {
    options = options || {};
    return this.ref.child(options.endpoint || resourceConfig.endpoint);
  }

  find(resourceConfig, id, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        this.getRef(resourceConfig, options).child(id).once('value', dataSnapshot => {
          let item = dataSnapshot.val();
          if (!item) {
            reject(new Error('Not Found!'));
          } else {
            item[resourceConfig.idAttribute] = item[resourceConfig.idAttribute] || id;
            resolve(item);
          }
        }, reject, this);
      });
    });
  }

  findAll(resourceConfig, params, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        this.getRef(resourceConfig, options).once('value', dataSnapshot => {
          let data = dataSnapshot.val();
          forOwn(data, (value, key) => {
            if (!value[resourceConfig.idAttribute]) {
              value[resourceConfig.idAttribute] = `/${key}`;
            }
          });
          resolve(filter.call(emptyStore, values(data), resourceConfig.name, params, options));
        }, reject, this);
      });
    });
  }

  create(resourceConfig, attrs, options) {
    var id = attrs[resourceConfig.idAttribute];
    if (DSUtils.isString(id) || DSUtils.isNumber(id)) {
      return this.update(resourceConfig, id, attrs, options);
    } else {
      return createTask((resolve, reject) => {
        queueTask(() => {
          let resourceRef = this.getRef(resourceConfig, options);
          var itemRef = resourceRef.push(removeCircular(omit(attrs, resourceConfig.relationFields || [])), err => {
            if (err) {
              return reject(err);
            } else {
              let id = itemRef.toString().replace(resourceRef.toString(), '');
              itemRef.child(resourceConfig.idAttribute).set(id, err => {
                if (err) {
                  reject(err);
                } else {
                  itemRef.once('value', dataSnapshot => {
                    try {
                      resolve(dataSnapshot.val());
                    } catch (err) {
                      reject(err);
                    }
                  }, reject, this);
                }
              });
            }
          });
        });
      });
    }
  }

  update(resourceConfig, id, attrs, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        attrs = removeCircular(omit(attrs || {}, resourceConfig.relationFields || []));
        let itemRef = this.getRef(resourceConfig, options).child(id);
        itemRef.once('value', dataSnapshot => {
          try {
            let item = dataSnapshot.val() || {};
            let fields, removed, i;
            if (resourceConfig.relations) {
              fields = resourceConfig.relationFields;
              removed = [];
              for (i = 0; i < fields.length; i++) {
                removed.push(attrs[fields[i]]);
                delete attrs[fields[i]];
              }
            }
            deepMixIn(item, attrs);
            if (resourceConfig.relations) {
              fields = resourceConfig.relationFields;
              for (i = 0; i < fields.length; i++) {
                let toAddBack = removed.shift();
                if (toAddBack) {
                  attrs[fields[i]] = toAddBack;
                }
              }
            }
            itemRef.set(item, err => {
              if (err) {
                reject(err);
              } else {
                resolve(item);
              }
            });
          } catch (err) {
            reject(err);
          }
        }, reject, this);
      });
    });
  }

  updateAll(resourceConfig, attrs, params, options) {
    return this.findAll(resourceConfig, params, options).then(items => {
      var tasks = [];
      DSUtils.forEach(items, item => {
        tasks.push(this.update(resourceConfig, item[resourceConfig.idAttribute], attrs, options));
      });
      return DSUtils.Promise.all(tasks);
    });
  }

  destroy(resourceConfig, id, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        this.getRef(resourceConfig, options).child(id).remove(err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  destroyAll(resourceConfig, params, options) {
    return this.findAll(resourceConfig, params, options).then(items => {
      var tasks = [];
      DSUtils.forEach(items, item => {
        tasks.push(this.destroy(resourceConfig, item[resourceConfig.idAttribute], options));
      });
      return DSUtils.Promise.all(tasks);
    });
  }
}

export default DSFirebaseAdapter;
