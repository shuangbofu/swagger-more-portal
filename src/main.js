import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
import 'normalize.css'
import store from './store'
import axios from 'axios'
import VueAxios from 'vue-axios'
axios.defaults.timeout = 10000;

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueAxios, axios);

new Vue({
  render: h => h(App),
  store
}).$mount('#app')
