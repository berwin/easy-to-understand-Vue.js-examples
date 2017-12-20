import {isObject} from './util.js'

export default class Watcher {
  constructor (vm, expOrFn, cb, options) {
    this.vm = vm

    // 新增
    if (options) {
      this.deep = !!options.deep
    } else {
      this.deep = false
    }

    this.deps = []
    this.depIds = new Set()
    this.getter = parsePath(expOrFn)
    this.cb = cb
    this.value = this.get()
  }

  get () {
    window.target = this
    let value = this.getter.call(this.vm, this.vm)
    if (this.deep) {
      traverse(value)
    }
    window.target = undefined
    return value
  }

  addDep (dep) {
    const id = dep.id
    if (!this.depIds.has(id)) {
      this.depIds.add(id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }

  teardown () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].removeSub(this)
    }
  }

  update () {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}

/**
 * Parse simple path.
 */
const bailRE = /[^\w.$]/
export function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}

const seenObjects = new Set()
export function traverse (val) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse (val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
