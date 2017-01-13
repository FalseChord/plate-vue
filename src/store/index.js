import Vue from 'vue'
import Vuex from 'vuex'
import { fetchArticles, fetchItems, fetchIdsByType, fetchQuestionnaire, fetchSectionList, fetchUser } from './api'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    articles: {},
    activeType: null,
    itemsPerPage: 20,
    items: {/* [id: number]: Item */},
    users: {/* [id: string]: User */},
    sectionList: {},
    questionnaire: {},
    lists: {
      top: [/* number */],
      new: [],
      show: [],
      ask: [],
      job: []
    }
  },

  actions: {
    FETCH_ARTICLES: ({ commit, state }, params = {}) => {
      return fetchArticles(params).then(articles => commit('SET_ARTICLES', { articles }))
    },

    // ensure data for rendering given list type
    FETCH_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
      commit('SET_ACTIVE_TYPE', { type })
      return fetchIdsByType(type)
        .then(ids => commit('SET_LIST', { type, ids }))
        .then(() => dispatch('ENSURE_ACTIVE_ITEMS'))
    },

    // ensure all active items are fetched
    ENSURE_ACTIVE_ITEMS: ({ dispatch, getters }) => {
      return dispatch('FETCH_ITEMS', {
        ids: getters.activeIds
      })
    },

    FETCH_ITEMS: ({ commit, state }, { ids }) => {
      // on the client, the store itself serves as a cache.
      // only fetch items that we do not already have, or has expired (3 minutes)
      const now = Date.now()
      ids = ids.filter(id => {
        const item = state.items[id]
        if (!item) {
          return true
        }
        if (now - item.__lastUpdated > 1000 * 60 * 3) {
          return true
        }
        return false
      })
      if (ids.length) {
        return fetchItems(ids).then(items => commit('SET_ITEMS', { items }))
      } else {
        return Promise.resolve()
      }
    },

    FETCH_SECTIONLIST: ({ commit, state }, { id }) => {
      return state.sectionList[ id ]
        ? Promise.resolve(state.sectionList[ id ])
        : fetchSectionList(id).then(sectionList => commit('SET_SECTIONLIST', { sectionList }))
    },

    FETCH_QUESTIONNAIRE: ({ commit, state }, { id }) => {
      return state.questionnaire[ id ]
        ? Promise.resolve(state.questionnaire[ id ])
        : fetchQuestionnaire(id).then(questionnaire => commit('SET_QUESTIONNAIRE', { questionnaire }))
    },

    FETCH_USER: ({ commit, state }, { id }) => {
      return state.users[id]
        ? Promise.resolve(state.users[id])
        : fetchUser(id).then(user => commit('SET_USER', { user }))
    }
  },

  mutations: {
    SET_ARTICLES: (state, { articles }) => {
      Vue.set(state, 'articles', articles)
    },

    SET_ACTIVE_TYPE: (state, { type }) => {
      state.activeType = type
    },

    SET_LIST: (state, { type, ids }) => {
      state.lists[type] = ids
    },

    SET_ITEMS: (state, { items }) => {
      items.forEach(item => {
        if (item) {
          Vue.set(state.items, item.id, item)
        }
      })
    },

    SET_SECTIONLIST: (state, { sectionList }) => {
      Vue.set(state.sectionList)
    },

    SET_QUESTIONNAIRE: (state, { questionnaire }) => {
      Vue.set(state.questionnaire, questionnaire.id, questionnaire)
    },

    SET_USER: (state, { user }) => {
      Vue.set(state.users, user.id, user)
    }
  },

  getters: {
    // ids of the items that should be currently displayed based on
    // current list type and current pagination
    activeIds (state) {
      const { activeType, itemsPerPage, lists } = state
      const page = Number(state.route.params.page) || 1
      if (activeType) {
        const start = (page - 1) * itemsPerPage
        const end = page * itemsPerPage
        return lists[activeType].slice(start, end)
      } else {
        return []
      }
    },

    // items that should be currently displayed.
    // this Array may not be fully fetched.
    activeItems (state, getters) {
      return getters.activeIds.map(id => state.items[id]).filter(_ => _)
    }
  }
})

export default store
