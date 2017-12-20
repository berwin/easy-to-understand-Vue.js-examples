(function () {
'use strict';

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

class Watcher {
  constructor (vm, expOrFn, cb, options) {
    this.vm = vm;

    // 新增
    if (options) {
      this.deep = !!options.deep;
    } else {
      this.deep = false;
    }

    this.deps = [];
    this.depIds = new Set();
    this.getter = parsePath(expOrFn);
    this.cb = cb;
    this.value = this.get();
  }

  get () {
    window.target = this;
    let value = this.getter.call(this.vm, this.vm);
    if (this.deep) {
      traverse(value);
    }
    window.target = undefined;
    return value
  }

  addDep (dep) {
    const id = dep.id;
    if (!this.depIds.has(id)) {
      this.depIds.add(id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }

  teardown () {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
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

const seenObjects = new Set();
function traverse (val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  let i, keys;
  const isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) _traverse(val[i], seen);
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) _traverse(val[keys[i]], seen);
  }
}

function stateMixin (Vue) {
  Vue.prototype.$watch = function (expOrFn, cb, options) {
    const vm = this;
    options = options || {};
    const watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
}

let uid = 0;

class Dep {
  constructor () {
    this.id = uid++;
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
      window.target.addDep(this);
    }
  }

  removeSub (sub) {
    const index = this.subs.indexOf(sub);
    if (index > -1) {
      return this.subs.splice(index, 1)
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

function Vue$1 (options) {
  this.data = options.data;
  new Observer(this.data);
}

stateMixin(Vue$1);

const vue = new Vue$1({
  data: {
    title: 'users',
    deep: {a: {b: {name: 'berwin'}}},
    list: [{name: 'berwin', age: 22}]
  }
});

const unwatchList = vue.$watch('data.list', (newValue) => {
  console.log('list: ', newValue);
});

const unwatchDeep = vue.$watch('data.deep', (newValue, oldValue) => {
  console.log('deep: ', newValue.a.b.name, oldValue.a.b.name);
}, {deep: true});

const unwatchTitle = vue.$watch('data.title', (newValue, oldValue) => {
  console.log('title: ', newValue, oldValue);
}, {immediate: true});

window.vue = vue;

document.getElementById('fetch').onclick = function () {
  console.log(vue);
};

document.getElementById('push').onclick = function () {
  vue.data.list.push({name: 'bowen', age: Math.random()});
};

document.getElementById('changeTitle').onclick = function () {
  vue.data.title = Math.random();
};

document.getElementById('deepChange').onclick = function () {
  vue.data.deep.a.b.name = Math.random();
};

document.getElementById('unwatch').onclick = function () {
  unwatchList();
  unwatchTitle();
  unwatchDeep();
};

}());
