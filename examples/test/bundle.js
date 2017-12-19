(function () {
'use strict';

class Dep {
  constructor () {
    this.subs = [];
  }

  addSub (sub) {
    this.subs.push(sub);
  }

  removeSub (sub) {
    remove(this.subs, sub);
  }

  depend () {
    if (window.target) {
      this.addSub(window.target);
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}

const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  // cache original method
  const original = arrayProto[method];
  Object.defineProperty(arrayMethods, method, {
    value: function mutator (...args) {
      const result = original.apply(this, args);
      const ob = this.__ob__;
      let inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }
      if (inserted) ob.observeArray(inserted);
      ob.dep.notify();
      return result
    },
    enumerable: false,
    writable: true,
    configurable: true
  });
});

function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

const hasProto = '__proto__' in {};

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * Observer 类会附加到每一个被侦测的 object 上。
 * 一旦被附加上，Observer 会将 object 的所有属性转换为 getter/setter 的形式
 * 来收集属性的依赖，并且当属性发生变化时，会通知这些依赖
 */
class Observer {
  constructor (value) {
    this.value = value;
    this.dep = new Dep();
    def(value, '__ob__', this);

    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }

  /**
   * Walk 会将每一个属性都转换成 getter/setter 的形式来侦测变化
   * 这个方法只有在数据类型为 Object 时被调用
   */
  walk (obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]]);
    }
  }

  observeArray (items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  }
}

/**
 * 尝试为 value 创建一个 Observer 实例，
 * 如果创建成功直接返回新创建的 Observer实例。
 * 如果 value 已经已经存在一个 Observer 实例则直接返回它
 */
function observe (value, asRootData) {
  if (!isObject(value)) {
    return
  }
  let ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob
}

function defineReactive (data, key, val) {
  let childOb = observe(val);
  let dep = new Dep();
  Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function () {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        return val
      },
      set: function (newVal) {
        if(val === newVal){
          return
        }
        val = newVal;
        dep.notify();
      }
  });
}

function protoAugment (target, src, keys) {
  target.__proto__ = src;
}

function copyAugment (target, src, keys) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    def(target, key, src[key]);
  }
}

class Watcher {
  constructor (vm, expOrFn, cb) {
    // 执行 this.getter() 就可以读取 data.a.b.c 的内容
    this.vm = vm;
    this.getter = parsePath(expOrFn);
    this.cb = cb;
    this.value = this.get();
  }

  get () {
    window.target = this;
    let value = this.getter.call(this.vm, this.vm);
    window.target = undefined;
    return value
  }

  update () {
    const oldValue = this.value;
    this.value = this.get();
    this.cb.call(this.vm, this.value, oldValue);
  }
}

/**
 * Parse simple path.
 */
const bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.');
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]];
    }
    return obj
  }
}

const obj = {title: 'users', list: [{name: 'berwin', age: 22}]};
new Observer(obj);
new Watcher(obj, 'title', (newValue, oldValue) => {
  console.log('title: ', newValue, oldValue);
});

new Watcher(obj, 'list', (newValue) => {
  console.log('list: ', newValue);
});

window.obj = obj;

document.getElementById('fetch').onclick = function () {
  console.log(obj);
};

document.getElementById('push').onclick = function () {
  obj.list.push({name: 'bowen', age: 23});
};

document.getElementById('changeTitle').onclick = function () {
  obj.title = 'Users';
};

}());
