<template>
  <vue-dfp-provider :dfpUnits="dfpUnits" :dfpid="dfpid" :section="`other`" :options="dfpOptions" :mode="dfpMode">
    <template slot-scope="props" slot="dfpPos">
      <div class="search-view">
        <section style="width: 100%;">
          <Header :dfpHeaderLogoLoaded="dfpHeaderLogoLoaded" :props="props" :showDfpHeaderLogo="showDfpHeaderLogo" />
        </section>
        <div class="search-title container">
          <span class="search-title__text" v-text="title"></span>
          <div class="search-title__colorBlock"></div>
        </div>
        <article-list :articles='articles' />
        <loading :show="loading" />
        <section class="container">
          <more v-if="hasMore" v-on:loadMore="loadMore" />
        </section>
        <section class="footer container">
          <app-footer />
        </section>
      </div>
      <LazyItemWrapper :loadAfterPageLoaded="true" v-if="(viewport < 550)">
        <DfpST :props="props">
          <vue-dfp :is="props.vueDfp" :config="props.config" pos="MBST" slot="dfpST" />
        </DfpST>
      </LazyItemWrapper>      
    </template>
  </vue-dfp-provider>
</template>

<script>

import _ from 'lodash'
import { DFP_ID, DFP_UNITS, DFP_OPTIONS, DFP_SIZE_MAPPING } from '../constants'
import { SITE_MOBILE_URL, SITE_TITLE, SITE_URL } from '../constants'
import { adtracker } from 'src/util/adtracking'
import { currEnv, unLockJS } from '../util/comm'
import { getRole } from '../util/mmABRoleAssign'
import ArticleList from '../components/ArticleList.vue'
import Cookie from 'vue-cookie'
import DfpST from '../components/DfpST.vue'
import Footer from '../components/Footer.vue'
import Header from '../components/Header.vue'
import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
import Loading from '../components/Loading.vue'
import More from '../components/More.vue'
import VueDfpProvider from 'plate-vue-dfp/DfpProvider.vue'

const MAXRESULT = 12
const PAGE = 1

const fetchCommonData = (store) => {
  return store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'sections', 'topics' ] })
}

const fetchSearch = (store, params) => store.dispatch('FETCH_SEARCH', { params, })

const fetchData = (store, route) => {
  return Promise.all([
    fetchCommonData(store),
    fetchSearch(store, {
      page: PAGE,
      max_results: MAXRESULT,
      keyword: route.params.keyword,
      where: {
        section: route.query.section,
        category: route.query.category
      }
    }),
    fetchPartners(store)
  ])
}

const fetchEvent = (store, eventType = 'embedded') => {
  return store.dispatch('FETCH_EVENT', {
    params: {
      'max_results': 1,
      'where': {
        isFeatured: true,
        eventType: eventType
      }
    }
  })
}

const fetchPartners = (store) => {
  const page = _.get(store.state, [ 'partners', 'meta', 'page' ], 0) + 1
  return store.dispatch('FETCH_PARTNERS', {
    params: {
      max_results: 25,
      page: page
    }
  }).then(() => {
    if (_.get(store.state, [ 'partners', 'items', 'length' ]) < _.get(store.state, [ 'partners', 'meta', 'total' ])) {
      fetchPartners(store)
    }
  })
}

export default {
  name: 'search-view',
  components: {
    'app-footer': Footer,
    'article-list': ArticleList,
    'loading': Loading,
    'more': More,
    'vue-dfp-provider': VueDfpProvider,
    DfpST,
    Header,
    LazyItemWrapper
  },
  asyncData ({ store, route }) {
    return fetchData(store, route)
  },
  metaInfo () {
    const ogTitle = `${this.title} - ${SITE_TITLE}`
    return {
      title: this.title,
      meta: [
        { name: 'robots', content: 'index' },
        { vmid: 'og:title', property: 'og:title', content: ogTitle },
        { vmid: 'og:url', property: 'og:url', content: `${SITE_URL}${this.$route.path}` },
        { vmid: 'twitter:title', name: 'twitter:title', content: ogTitle },
      ],
      link: [
        { rel: 'alternate', href: `${SITE_MOBILE_URL}${this.$route.path}` }
      ]
    }
  },
  data () {
    return {
      abIndicator: '',
      commonData: this.$store.state.commonData,
      dfpid: DFP_ID,
      dfpHeaderLogoLoaded: false,
      dfpMode: 'prod',
      dfpUnits: DFP_UNITS,
      isVponSDKLoaded: false,
      loading: false,
      page: PAGE,
      showDfpCoverAdFlag: false,
      showDfpCoverAd2Flag: false,
      showDfpCoverAdVponFlag: false,
      showDfpHeaderLogo: false,
      viewport: undefined
    }
  },
  computed: {
    articles () {
      return _.get(this.$store, 'getters.searchResultNormalized', [])
    },
    eventLogo () {
      return _.get(this.$store.state.eventLogo, 'items.0')
    },
    hasMore () {
      return _.get(this.articles, 'length', 0) < _.get(this.$store, 'getters.searchResultTotalCount', 0)
    },
    title () {
      return this.$route.params.keyword
    },
    dfpOptions () {
      const currentInstance = this
      return Object.assign({}, DFP_OPTIONS, {
        afterEachAdLoaded: function (event) {
          const dfpCover = document.querySelector(`#${event.slot.getSlotElementId()}`)
          const position = dfpCover.getAttribute('pos')

          /**
          * Because googletag.pubads().addEventListener('slotRenderEnded', afterEachAdLoaded) can't be removed.
          * We have check if current page gets changed with checking by sessionId to prevent from runnig this outdated callback.
          */
          const elSessionId = dfpCover.getAttribute('sessionId')
          if (elSessionId !== this.sessionId) { return }

          const adDisplayStatus = dfpCover.currentStyle ? dfpCover.currentStyle.display : window.getComputedStyle(dfpCover, null).display

          switch (position) {
            case 'LOGO':
              if (adDisplayStatus !== 'none') {
                currentInstance.showDfpHeaderLogo = true
              }
              currentInstance.dfpHeaderLogoLoaded = true
              break
          }
          adtracker({
            el: dfpCover,
            slot: event.slot.getSlotElementId(),
            position,
            isAdEmpty: adDisplayStatus === 'none',
            sessionId: elSessionId
          })   
        },
        setCentering: true,
        sizeMapping: DFP_SIZE_MAPPING
      })
    }
  },
  methods: {
    checkIfLockJS () {
      unLockJS()
    },
    getMmid () {
      const mmid = Cookie.get('mmid')
      let assisgnedRole = _.get(this.$route, [ 'query', 'ab' ])
      if (assisgnedRole) {
        assisgnedRole = assisgnedRole.toUpperCase()
      }
      const role = getRole({ mmid, distribution: [
        { id: 'A', weight: 50 },
        { id: 'B', weight: 50 } ]
      })
      return assisgnedRole || role
    },
    loadMore () {
      this.page += 1
      this.loading = true
      fetchSearch(this.$store, {
        page: this.page,
        max_results: MAXRESULT,
        keyword: this.$route.params.keyword,
        where: {
          section: this.$route.query.section,
          category: this.$route.query.category
        }
      }).then(() => {
        this.loading = false
      })
    },
    updateViewport () {
      if (process.env.VUE_ENV === 'client') {
        this.viewport = document.querySelector('body').offsetWidth
      }
    },
    updateSysStage () {
      this.dfpMode = currEnv()
    }
  },
  beforeMount () {
    fetchEvent(this.$store, 'logo') 
  },
  mounted () {
    this.checkIfLockJS()
    this.updateViewport()
    window.addEventListener('resize', () => {
      this.updateViewport()
    })
    this.updateSysStage()
    // this.abIndicator = this.getMmid()
    window.ga('set', 'contentGroup1', '')
    window.ga('set', 'contentGroup2', '')
    window.ga('set', 'contentGroup3', '')
    // window.ga('set', 'contentGroup3', `list${this.abIndicator}`)
    window.ga('send', 'pageview', { title: `${this.title} - ${SITE_TITLE}`, location: document.location.href })
  },
  updated () {
    this.updateSysStage()
  },
  watch: {
    title: function () {
      if (process.env.VUE_ENV === 'client') {
        window.ga('send', 'pageview', { title: `${this.title} - ${SITE_TITLE}`, location: document.location.href })
        this.$forceUpdate()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>

.search
  &-title
    &.container
      position: relative
      align-items: center
      flex-direction row
      margin-top 40px
      padding 0 2em
    &__text
        font-size 3rem
    &__colorBlock
      flex-grow 1
      height 10px
      margin-left: 10px
      background linear-gradient(to right, #bcbcbc 0%, rgba(242, 242, 242, 1) 70%, rgba(242, 242, 242, 1) 100%)

@media (min-width: 600px)
  .search
    &-title
      &.container
        padding-left 10px
</style>
