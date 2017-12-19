export default class Watcher {
  constructor (vm, expOrFn, cb) {
    // 执行 this.getter() 就可以读取 data.a.b.c 的内容
    this.vm = vm
    this.getter = parsePath(expOrFn)
    this.cb = cb
    this.value = this.get()
  }

  get () {
    window.target = this
    let value = this.getter.call(this.vm, this.vm)
    window.target = undefined
    return value
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