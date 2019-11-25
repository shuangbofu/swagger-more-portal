import Vuex from 'vuex'
import Vue from 'vue'
// import axios from 'axios'
import mockData from '@/data.json'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    data: {},
    tags: [],
    apis: [],
    // apiIndex: ''
    apiIndexes: [],
  },
  getters: {
    info: state => state.data.info,
    tags: state => state.tags,
    apis: state => state.apis,
    apiTabs: state => state.apis.filter(api => state.apiIndexes.includes(api.name)),
  },
  mutations: {
    CHOOSE_API(state, index) {
      if (!state.apiIndexes.includes(index)) {
        state.apiIndexes.push(index)
      }
    },
    INIT(state, data) {
      data.info.basePath = data.basePath
      state.data = data
      let tags = data.tags
      let apis = []
      for (let pathName in data.paths) {
        let path = data.paths[pathName].post
        const api = {
          ...path,
          type: 'post',
          name: pathName
        }
        path.tags.forEach(tagName => {
          let tag = tags.find(tag => tag.name === tagName)
          if (!tag.apis) {
            tag.apis = []
          }
          tag.apis.push(api)
        })
        apis.push(api)
      }
      state.tags = tags
      state.apis = apis
    }
  },
  actions: {
    init({ commit }) {
      commit('INIT', mockData)
      // axios({
      //   method: 'post',
      //   url: '/user',
      //   data: {}
      // }).then(data => {
      //   console.log(mockData)
      //   commit('INIT', data)
      // }).catch(msg => {
      //   // console.log(msg)
      // })
    }
  }
})

export default store