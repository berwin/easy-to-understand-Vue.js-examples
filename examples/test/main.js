import Observer from '../../core/observer/index.js'
import Watcher from '../../core/observer/watcher.js'

const obj = {a: '123'}
new Observer(obj)
new Watcher(obj, 'a', (newValue, oldValue) => {
  console.log(newValue, oldValue)
})

window.obj = obj
