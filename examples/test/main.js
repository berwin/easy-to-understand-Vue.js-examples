import Vue from '../../core/index.js'

const vue = new Vue({
  data: {
    title: 'users',
    deep: {a: {b: {name: 'berwin'}}},
    list: [{name: 'berwin', age: 22}]
  }
})

const unwatchList = vue.$watch('data.list', (newValue) => {
  console.log('list: ', newValue)
})

const unwatchDeep = vue.$watch('data.deep', (newValue, oldValue) => {
  console.log('deep: ', newValue.a.b.name, oldValue.a.b.name)
}, {deep: true})

const unwatchTitle = vue.$watch('data.title', (newValue, oldValue) => {
  console.log('title: ', newValue, oldValue)
}, {immediate: true})

window.vue = vue

document.getElementById('fetch').onclick = function () {
  console.log(vue)
}

document.getElementById('push').onclick = function () {
  vue.data.list.push({name: 'bowen', age: Math.random()})
}

document.getElementById('changeTitle').onclick = function () {
  vue.data.title = Math.random()
}

document.getElementById('deepChange').onclick = function () {
  vue.data.deep.a.b.name = Math.random()
}

document.getElementById('unwatch').onclick = function () {
  unwatchList()
  unwatchTitle()
  unwatchDeep();
}

