import Observer from '../../core/observer/index.js'
import Watcher from '../../core/observer/watcher.js'

const obj = {title: 'users', list: [{name: 'berwin', age: 22}]}
new Observer(obj)
new Watcher(obj, 'title', (newValue, oldValue) => {
  console.log('title: ', newValue, oldValue)
})

new Watcher(obj, 'list', (newValue) => {
  console.log('list: ', newValue)
})

window.obj = obj

document.getElementById('fetch').onclick = function () {
  console.log(obj)
}

document.getElementById('push').onclick = function () {
  obj.list.push({name: 'bowen', age: 23})
}

document.getElementById('changeTitle').onclick = function () {
  obj.title = 'Users'
}
