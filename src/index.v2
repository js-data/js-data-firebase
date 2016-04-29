let JSData = require('js-data');
let Firebase = require('firebase');
let values = require('mout/object/values');
let map = require('mout/array/map');
let unique = require('mout/array/unique');

let emptyStore = new JSData.DS();
let DSUtils = JSData.DSUtils;
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
    DSUtils.deepMixIn(this.defaults, options);
    this.ref = new Firebase(options.basePath || this.defaults.basePath);
  }

  getRef(resourceConfig, options) {
    options = options || {};
    return this.ref.child(options.endpoint || resourceConfig.endpoint);
  }

  find(resourceConfig, id, options) {
    let instance;
    options = options || {};
    options.with = options.with || [];
    return new DSUtils.Promise((resolve, reject) => {
      this.getRef(resourceConfig, options).child(id).once('value', dataSnapshot => {
        let item = dataSnapshot.val();
        if (!item) {
          reject(new Error('Not Found!'));
        } else {
          item[resourceConfig.idAttribute] = item[resourceConfig.idAttribute] || id;
          resolve(item);
        }
      }, reject, this);
    }).then(_instance => {
        instance = _instance;
        let tasks = [];

        DSUtils.forEach(resourceConfig.relationList, def => {
          let relationName = def.relation;
          let relationDef = resourceConfig.getResource(relationName);
          let containedName = null;
          if (DSUtils.contains(options.with, relationName)) {
            containedName = relationName;
          } else if (DSUtils.contains(options.with, def.localField)) {
            containedName = def.localField;
          }
          if (containedName) {
            let __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options);
            __options.with = options.with.slice();
            __options = DSUtils._(relationDef, __options);
            DSUtils.remove(__options.with, containedName);
            DSUtils.forEach(__options.with, (relation, i) => {
              if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
                __options.with[i] = relation.substr(containedName.length + 1);
              } else {
                __options.with[i] = '';
              }
            });

            let task;

            if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
              task = this.findAll(resourceConfig.getResource(relationName), {
                where: {
                  [def.foreignKey]: {
                    '==': instance[resourceConfig.idAttribute]
                  }
                }
              }, __options).then(relatedItems => {
                if (def.type === 'hasOne' && relatedItems.length) {
                  DSUtils.set(instance, def.localField, relatedItems[0]);
                } else {
                  DSUtils.set(instance, def.localField, relatedItems);
                }
                return relatedItems;
              });
            } else if (def.type === 'hasMany' && def.localKeys) {
              let localKeys = [];
              let itemKeys = instance[def.localKeys] || [];
              itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys);
              localKeys = localKeys.concat(itemKeys || []);
              task = this.findAll(resourceConfig.getResource(relationName), {
                where: {
                  [relationDef.idAttribute]: {
                    'in': DSUtils.filter(unique(localKeys), x => x)
                  }
                }
              }, __options).then(relatedItems => {
                DSUtils.set(instance, def.localField, relatedItems);
                return relatedItems;
              });
            } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
              task = this.find(resourceConfig.getResource(relationName), DSUtils.get(instance, def.localKey), __options).then(relatedItem => {
                DSUtils.set(instance, def.localField, relatedItem);
                return relatedItem;
              });
            }

            if (task) {
              tasks.push(task);
            }
          }
        });

        return DSUtils.Promise.all(tasks);
      })
      .then(() => instance);
  }

  findAll(resourceConfig, params, options) {
    let items = null;
    options = options || {};
    options.with = options.with || [];
    return new DSUtils.Promise((resolve, reject) => {
      this.getRef(resourceConfig, options).once('value', dataSnapshot => {
        let data = dataSnapshot.val();
        DSUtils.forOwn(data, (value, key) => {
          if (!value[resourceConfig.idAttribute]) {
            value[resourceConfig.idAttribute] = `/${key}`;
          }
        });
        resolve(filter.call(emptyStore, values(data), resourceConfig.name, params, options));
      }, reject, this);
    }).then(_items => {
        items = _items;
        let tasks = [];
        DSUtils.forEach(resourceConfig.relationList, def => {
          let relationName = def.relation;
          let relationDef = resourceConfig.getResource(relationName);
          let containedName = null;
          if (DSUtils.contains(options.with, relationName)) {
            containedName = relationName;
          } else if (DSUtils.contains(options.with, def.localField)) {
            containedName = def.localField;
          }
          if (containedName) {
            let __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options);
            __options.with = options.with.slice();
            __options = DSUtils._(relationDef, __options);
            DSUtils.remove(__options.with, containedName);

            DSUtils.forEach(__options.with, (relation, i) => {
              if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
                __options.with[i] = relation.substr(containedName.length + 1);
              } else {
                __options.with[i] = '';
              }
            });

            let task;

            if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
              task = this.findAll(resourceConfig.getResource(relationName), {
                where: {
                  [def.foreignKey]: {
                    'in': DSUtils.filter(map(items, item => DSUtils.get(item, resourceConfig.idAttribute)), x => x)
                  }
                }
              }, __options).then(relatedItems => {
                DSUtils.forEach(items, item => {
                  let attached = [];
                  DSUtils.forEach(relatedItems, relatedItem => {
                    if (DSUtils.get(relatedItem, def.foreignKey) === item[resourceConfig.idAttribute]) {
                      attached.push(relatedItem);
                    }
                  });
                  if (def.type === 'hasOne' && attached.length) {
                    DSUtils.set(item, def.localField, attached[0]);
                  } else {
                    DSUtils.set(item, def.localField, attached);
                  }
                });
                return relatedItems;
              });
            } else if (def.type === 'hasMany' && def.localKeys) {
              let localKeys = [];
              DSUtils.forEach(items, item => {
                let itemKeys = item[def.localKeys] || [];
                itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys);
                localKeys = localKeys.concat(itemKeys || []);
              });
              task = this.findAll(resourceConfig.getResource(relationName), {
                where: {
                  [relationDef.idAttribute]: {
                    'in': DSUtils.filter(unique(localKeys), x => x)
                  }
                }
              }, __options).then(relatedItems => {
                DSUtils.forEach(items, item => {
                  let attached = [];
                  let itemKeys = item[def.localKeys] || [];
                  itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys);
                  DSUtils.forEach(relatedItems, relatedItem => {
                    if (itemKeys && DSUtils.contains(itemKeys, relatedItem[relationDef.idAttribute])) {
                      attached.push(relatedItem);
                    }
                  });
                  DSUtils.set(item, def.localField, attached);
                });
                return relatedItems;
              });
            } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
              task = this.findAll(resourceConfig.getResource(relationName), {
                where: {
                  [relationDef.idAttribute]: {
                    'in': DSUtils.filter(map(items, item => DSUtils.get(item, def.localKey)), x => x)
                  }
                }
              }, __options).then(relatedItems => {
                DSUtils.forEach(items, item => {
                  DSUtils.forEach(relatedItems, relatedItem => {
                    if (relatedItem[relationDef.idAttribute] === item[def.localKey]) {
                      DSUtils.set(item, def.localField, relatedItem);
                    }
                  });
                });
                return relatedItems;
              });
            }

            if (task) {
              tasks.push(task);
            }
          }
        });
        return DSUtils.Promise.all(tasks);
      }).then(() => items);
  }

  create(resourceConfig, attrs, options) {
    var id = attrs[resourceConfig.idAttribute];
    if (DSUtils.isString(id) || DSUtils.isNumber(id)) {
      return this.update(resourceConfig, id, attrs, options);
    } else {
      return createTask((resolve, reject) => {
        queueTask(() => {
          let resourceRef = this.getRef(resourceConfig, options);
          var itemRef = resourceRef.push(DSUtils.removeCircular(DSUtils.omit(attrs, resourceConfig.relationFields || [])), err => {
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
        attrs = DSUtils.removeCircular(DSUtils.omit(attrs || {}, resourceConfig.relationFields || []));
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
            DSUtils.deepMixIn(item, attrs);
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

module.exports = DSFirebaseAdapter;
