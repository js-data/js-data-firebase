import JSData from 'js-data';
import Firebase from 'firebase';
import omit from 'mout/object/omit';
import values from 'mout/object/values';

let emptyStore = new JSData.DS();
let DSUtils = JSData.DSUtils;
let { deepMixIn, removeCircular, Promise: P, forOwn  } = DSUtils;
let filter = emptyStore.defaults.defaultFilter;

class Defaults {

}

Defaults.prototype.basePath = '';

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
    return new P((resolve, reject) => {
      return this.getRef(resourceConfig, options).child(id).once('value', dataSnapshot => {
        let item = dataSnapshot.val();
        if (!item) {
          reject(new Error('Not Found!'));
        } else {
          item[resourceConfig.idAttribute] = item[resourceConfig.idAttribute] || id;
          resolve(item);
        }
      }, reject, this);
    });
  }

  findAll(resourceConfig, params, options) {
    return new P((resolve, reject) => {
      return this.getRef(resourceConfig, options).once('value', dataSnapshot => {
        let data = dataSnapshot.val();
        forOwn(data, (value, key) => {
          if (!value[resourceConfig.idAttribute]) {
            value[resourceConfig.idAttribute] = `/${key}`;
          }
        });
        resolve(filter.call(emptyStore, values(data), resourceConfig.name, params, options));
      }, reject, this);
    });
  }

  create(resourceConfig, attrs, options) {
    var id = attrs[resourceConfig.idAttribute];
    if (DSUtils.isString(id) || DSUtils.isNumber(id)) {
      return this.update(resourceConfig, id, attrs, options);
    } else {
      return new P((resolve, reject) => {
        let resourceRef = this.getRef(resourceConfig, options);
        let itemRef = resourceRef.push(removeCircular(omit(attrs, resourceConfig.relationFields || [])), err => {
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
    }
  }

  update(resourceConfig, id, attrs, options) {
    attrs = removeCircular(omit(attrs || {}, resourceConfig.relationFields || []));
    return new P((resolve, reject) => {
      let itemRef = this.getRef(resourceConfig, options).child(id);
      itemRef.once('value', dataSnapshot => {
        try {
          let item = dataSnapshot.val() || {};
          let fields, removed, i;
          if (resourceConfig.relations) {
            fields = resourceConfig.relationFields;
            removed = [];
            for (i = 0; fields.length; i++) {
              removed.push(attrs[fields[i]]);
              delete attrs[fields[i]];
            }
          }
          deepMixIn(item, attrs);
          if (resourceConfig.relations) {
            fields = resourceConfig.relationFields;
            for (i = 0; fields.length; i++) {
              attrs[fields[i]] = removed.shift();
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
  }

  updateAll(resourceConfig, attrs, params, options) {
    return this.findAll(resourceConfig, params, options).then(items => {
      var tasks = [];
      DSUtils.forEach(items, item => {
        tasks.push(this.update(resourceConfig, item[resourceConfig.idAttribute], attrs, options));
      });
      return P.all(tasks);
    });
  }

  destroy(resourceConfig, id, options) {
    return new P((resolve, reject) => {
      this.getRef(resourceConfig, options).child(id).remove(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  destroyAll(resourceConfig, params, options) {
    return this.findAll(resourceConfig, params, options).then(items => {
      var tasks = [];
      DSUtils.forEach(items, item => {
        tasks.push(this.destroy(resourceConfig, item[resourceConfig.idAttribute], options));
      });
      return P.all(tasks);
    });
  }
}

export default DSFirebaseAdapter;
