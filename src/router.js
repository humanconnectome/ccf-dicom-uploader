import Vue from 'vue'
import Router from 'vue-router'
import Navigation from './components/Navigation.vue'
import Servers from './components/Servers.vue'
import Options from './components/Options.vue'
import Upload from './components/Upload.vue'

Vue.use(Router)

// Vue.http.options.emulateJSON = true;

var router = new Router({
  routes: [
    {
      path: '/servers',
      name: 'servers',
      component: Servers
    },
    {
      path: '/options',
      name: 'options',
      component: Options
    },
    {
      path: '/upload',
      name: 'upload',
      component: Upload
    }
  ]
})

const app = new Vue({
  el: '#app',
  router,
  template: '<Navigation/>',
  components: { Navigation }
})
