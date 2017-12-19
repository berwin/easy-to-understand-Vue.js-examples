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

/**
 * Observer 类会附加到每一个被侦测的 object 上。
 * 一旦被附加上，Observer 会将 object 的所有属性转换为 getter/setter 的形式
 * 来收集属性的依赖，并且当属性发生变化时，会通知这些依赖
 */
class Observer {
  constructor (value) {
    this.value = value;

    if (!Array.isArray(value)) {
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
}

function defineReactive (data, key, val) {
  // 新增，递归子属性
  if (typeof val === 'object') {
    new Observer(val);
  }
  let dep = new Dep();
  Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function () {
        dep.depend();
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

const obj = {a: '123'};
new Observer(obj);
new Watcher(obj, 'a', (newValue, oldValue) => {
  console.log(newValue, oldValue);
});

window.obj = obj;

}());
