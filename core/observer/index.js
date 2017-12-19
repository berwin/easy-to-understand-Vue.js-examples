import Dep from './dep.js'
import { arrayMethods } from './array'
import {
  hasProto,
  def,
  isObject,
  hasOwn
} from './util.js'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * Observer 类会附加到每一个被侦测的 object 上。
 * 一旦被附加上，Observer 会将 object 的所有属性转换为 getter/setter 的形式
 * 来收集属性的依赖，并且当属性发生变化时，会通知这些依赖
 */
export default class Observer {
  constructor (value) {
    this.value = value
    this.dep = new Dep()
    def(value, '__ob__', this)

    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
    } else {
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

  observeArray (items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

/**
 * 尝试为 value 创建一个 Observer 实例，
 * 如果创建成功直接返回新创建的 Observer实例。
 * 如果 value 已经已经存在一个 Observer 实例则直接返回它
 */
export function observe (value, asRootData) {
  if (!isObject(value)) {
    return
  }
  let ob
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }
  return ob
}

function defineReactive (data, key, val) {
  let childOb = observe(val)
  let dep = new Dep()
  Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function () {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
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

function protoAugment (target, src, keys) {
  target.__proto__ = src
}

function copyAugment (target, src, keys) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}