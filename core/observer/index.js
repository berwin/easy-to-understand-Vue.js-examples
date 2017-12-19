import Dep from './dep.js'

/**
 * Observer 类会附加到每一个被侦测的 object 上。
 * 一旦被附加上，Observer 会将 object 的所有属性转换为 getter/setter 的形式
 * 来收集属性的依赖，并且当属性发生变化时，会通知这些依赖
 */
export default class Observer {
  constructor (value) {
    this.value = value

    if (!Array.isArray(value)) {
      this.walk(value)
    }
  }

  /**
   * Walk 会将每一个属性都转换成 getter/setter 的形式来侦测变化
   * 这个方法只有在数据类型为 Object 时被调用
   */
  walk (obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }
}

function defineReactive (data, key, val) {
  // 新增，递归子属性
  if (typeof val === 'object') {
    new Observer(val)
  }
  let dep = new Dep()
  Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function () {
        dep.depend()
        return val
      },
      set: function (newVal) {
        if(val === newVal){
          return
        }
        val = newVal
        dep.notify()
      }
  })
}