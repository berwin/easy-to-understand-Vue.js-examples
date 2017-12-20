import Vue from '../../core/index.js'

const vue = new Vue({
  data: {
    title: 'users',
    deep: {a: {b: {name: 'berwin'}}},
    list: [{name: 'berwin', age: 22}]
  }
})

window.vue = vue

const unwatchList = vue.$watch('data.list', (newValue) => {
  console.log('list: ', newValue)
})

const unwatchDeep = vue.$watch('data.deep', (newValue, oldValue) => {
  console.log('deep: ', newValue, oldValue)
}, {deep: true})

const unwatchTitle = vue.$watch('data.title', (newValue, oldValue) => {
  console.log('title: ', newValue, oldValue)
}, {immediate: true})

const handlers = {
  fetch () {
    console.log(vue.data)
  },
  push () {
    vue.data.list.push({name: 'bowen', age: Math.random()})
  },
  changeTitle () {
    vue.data.title = Math.random()
  },
  deepChange () {
    vue.data.deep.a.b.name = Math.random()
  },
  set () {
    vue.$set(vue.data, 'name', Math.random())
  },
  del () {
    vue.$delete(vue.data.deep, 'a')
  },
  unwatch () {
    unwatchList()
    unwatchTitle()
    unwatchDeep()
  }
}

document.body.onclick = function (event) {
  handlers[event.target.id] && handlers[event.target.id]()
}
