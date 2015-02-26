var JSData, Firebase;

try {
  JSData = require('js-data');
  Firebase = require('firebase');
} catch (e) {
}

if (!JSData) {
  try {
    JSData = window.JSData;
    Firebase = window.Firebase;
  } catch (e) {
  }
}

if (!JSData) {
  throw new Error('js-data must be loaded!');
} else if (!Firebase) {
  throw new Error('firebase must be loaded!');
}

var emptyStore = new JSData.DS();
var DSUtils = JSData.DSUtils;
var deepMixIn = DSUtils.deepMixIn;
var filter = emptyStore.defaults.defaultFilter;
var values = require('mout/object/values');
var P = DSUtils.Promise;

function Defaults() {

}

Defaults.prototype.basePath = '';

function DSFirebaseAdapter(options) {
  options = options || {};
  this.defaults = new Defaults();
  deepMixIn(this.defaults, options);
  this.ref = new Firebase(options.basePath || this.defaults.basePath);
}

var dsFirebaseAdapterPrototype = DSFirebaseAdapter.prototype;

dsFirebaseAdapterPrototype.getRef = function (resourceConfig, options) {
  options = options || {};
  return this.ref.child(options.endpoint || resourceConfig.endpoint);
};

dsFirebaseAdapterPrototype.find = function (resourceConfig, id, options) {
  var _this = this;
  return new P(function (resolve, reject) {
    return _this.getRef(resourceConfig, options).child(id).once('value', function (dataSnapshot) {
      var item = dataSnapshot.val();
      if (!item) {
        reject(new Error('Not Found!'));
      } else {
        resolve(item);
      }
    }, reject, _this);
  });
};

dsFirebaseAdapterPrototype.findAll = function (resourceConfig, params, options) {
  var _this = this;
  return new P(function (resolve, reject) {
    return _this.getRef(resourceConfig, options).once('value', function (dataSnapshot) {
      resolve(filter.call(emptyStore, values(dataSnapshot.val()), resourceConfig.name, params, options));
    }, reject, _this);
  });
};

dsFirebaseAdapterPrototype.create = function (resourceConfig, attrs, options) {
  var _this = this;
  var id = attrs[resourceConfig.idAttribute];
  if (DSUtils.isString(id) || DSUtils.isNumber(id)) {
    return _this.update(resourceConfig, id, attrs, options);
  } else {
    return new P(function (resolve, reject) {
      var resourceRef = _this.getRef(resourceConfig, options);
      var itemRef = resourceRef.push(attrs, function (err) {
        if (err) {
          return reject(err);
        } else {
          var id = itemRef.toString().replace(resourceRef.toString(), '');
          itemRef.child(resourceConfig.idAttribute).set(id, function (err) {
            if (err) {
              reject(err);
            } else {
              itemRef.once('value', function (dataSnapshot) {
                try {
                  resolve(dataSnapshot.val());
                } catch (err) {
                  reject(err);
                }
              }, reject, _this);
            }
          });
        }
      });
    });
  }
};

dsFirebaseAdapterPrototype.update = function (resourceConfig, id, attrs, options) {
  var _this = this;
  return new P(function (resolve, reject) {
    var itemRef = _this.getRef(resourceConfig, options).child(id);
    itemRef.once('value', function (dataSnapshot) {
      try {
        var item = dataSnapshot.val() || {};
        var fields, removed, i;
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
        itemRef.set(item, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(item);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, reject, _this);
  });
};

dsFirebaseAdapterPrototype.updateAll = function (resourceConfig, attrs, params, options) {
  var _this = this;
  return _this.findAll(resourceConfig, params, options).then(function (items) {
    var tasks = [];
    DSUtils.forEach(items, function (item) {
      tasks.push(_this.update(resourceConfig, item[resourceConfig.idAttribute], attrs, options));
    });
    return P.all(tasks);
  });
};

dsFirebaseAdapterPrototype.destroy = function (resourceConfig, id, options) {
  var _this = this;
  return new P(function (resolve, reject) {
    _this.getRef(resourceConfig, options).child(id).remove(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

dsFirebaseAdapterPrototype.destroyAll = function (resourceConfig, params, options) {
  var _this = this;
  return _this.findAll(resourceConfig, params, options).then(function (items) {
    var tasks = [];
    DSUtils.forEach(items, function (item) {
      tasks.push(_this.destroy(resourceConfig, item[resourceConfig.idAttribute], options));
    });
    return P.all(tasks);
  });
};

module.exports = DSFirebaseAdapter;
