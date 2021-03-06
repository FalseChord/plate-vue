<template>
  <vue-dfp-provider :dfpUnits="DFP_UNITS" :dfpid="DFP_ID" section="home" :options="dfpOptions" :mode="dfpMode" :key="`homepage`">
    <template slot-scope="props" slot="dfpPos">
      <div class="home-view">
        <section style="width: 100%;">
          <Header :dfpHeaderLogoLoaded="dfpHeaderLogoLoaded" :props="props" :showDfpHeaderLogo="showDfpHeaderLogo" activeSection="home" />
        </section>
        <LazyItemWrapper :loadAfterPageLoaded="true">
          <vue-dfp
            :is="props.vueDfp"
            v-if="isMobile"
            :config="props.config"
            :size="get($store, 'getters.adSize')"
            pos="LMBHD" 
          />
          <vue-dfp
            :is="props.vueDfp"
            v-else
            :config="props.config"
            pos="LPCHD"
          />
        </LazyItemWrapper>
        <section class="home-mainContent">
          <FlashNews :articles="flashNewsArticle" />

          <EditorChoice :editorChoice='editorChoice' :viewport="viewportWidth" target="_blank" />
          <main>
            <LazyItemWrapper :loadAfterPageLoaded="true">
              <vue-dfp
                :is="props.vueDfp"
                v-if="isMobile"
                :config="props.config"
                :size="get($store, 'getters.adSize')"
                pos="LMBL1"
              />
            </LazyItemWrapper>
            <MirrorMediaTVAside v-if="isMobile && hasEventEmbedded" :mediaData="eventMod"></MirrorMediaTVAside>
            <div class="aside-title" ref="aside_title" v-show="isMobile"><h2 v-text="$t('homepage.focus')"></h2></div>
            <div class="focusNewsContainer" id="homepage-focus-news">
              <div v-show="isMobile"
                class="focusNewsContainer__latest-mobile-b"
              >
                <LatestArticleFocus
                  v-for="(o, i) in groupedArticle"
                  :key="`${i}-groupedlist-mobile-b`"
                  :groupedArticle="o"
                />
              </div>
            </div>
            <LazyItemWrapper :loadAfterPageLoaded="true">
              <vue-dfp
                :is="props.vueDfp"
                v-if="isMobile"
                :config="props.config"
                :size="get($store, 'getters.adSize')"
                pos="LMBL2"
              />
              <vue-dfp
                :is="props.vueDfp"
                v-else
                :config="props.config"
                pos="LPCB1"
              />
            </LazyItemWrapper>
            <LatestArticleMain id="latestArticle" target="_blank"
              :latestList="latestArticle"
              :viewport="viewportWidth">
            </LatestArticleMain>
          </main>
          <aside>
            <div>
              <MirrorMediaTVAside v-if="viewportWidth >= 1200 && hasEventEmbedded" :mediaData="eventMod"></MirrorMediaTVAside>
              <div class="aside-title" ref="aside_title"><h2 v-text="$t('homepage.focus')"></h2></div>
              <LatestArticleAside v-for="(o, i) in groupedArticle" target="_blank"
                :groupedArticle="o"
                :index="i"
                :needStick="false"
                :viewport="viewportWidth"
                :isLast="(i === (groupedArticle.length - 1)) ? '-last' : ''"
                :class="{ last: i === (groupedArticle.length - 1), secondLast: i === (groupedArticle.length - 2), first: i === 0 }"
                :key="`${i}-groupedlist`" />
            </div>
          </aside>
        </section>
        <Loading :show="loading" />
        <LazyItemWrapper :position="verge.viewportH()" :strict="true">
          <LiveStream v-if="hasEventEmbedded" :mediaData="eventEmbedded" />
          <LiveStream v-else-if="!hasEventEmbedded && hasEventMod" :mediaData="eventMod" type="mod" />
        </LazyItemWrapper>
        <template v-if="isMobile">
          <DfpCover v-show="showDfpCoverAdFlag">
            <vue-dfp
              :is="props.vueDfp"
              slot="ad-cover"
              :config="props.config"
              pos="LMBCVR"
            />
          </DfpCover>
          <DfpCover
            v-if="showDfpCoverAd2Flag"
            :showCloseBtn="false"
            class="raw"
          >
            <vue-dfp
              :is="props.vueDfp"
              slot="ad-cover"
              :config="props.config"
              pos="LMBCVR2"
            />
          </DfpCover>
          <DfpCover
            v-if="showDfpCoverInnityFlag"
            :showCloseBtn="false"
            class="raw"
          >
            <vue-dfp
              :is="props.vueDfp"
              slot="ad-cover"
              :config="props.config"
              pos="LMBCVR3"
            />
          </DfpCover>
        </template>
      </div>
    </template>
  </vue-dfp-provider>
</template>

<script>
import { DFP_ID, DFP_UNITS, DFP_OPTIONS, DFP_SIZE_MAPPING, CATEGORY_POLITICAL_ID, CATEGORY_CITY_NEWS_ID, CATEGORY_BUSINESS_ID, CATEGORY_LATESTNEWS_ID } from 'src/constants'
import { SITE_MOBILE_URL, SITE_TITLE } from 'src/constants'
import { currentYPosition, elmYPosition } from 'kc-scroll'
import { currEnv, sendAdCoverGA, unLockJS, updateCookie } from 'src/util/comm'
import { getRole } from 'src/util/mmABRoleAssign'
import { adtracker } from 'src/util/adtracking'
import { concat, drop, dropRight, flatten, get, includes, map, remove, slice, union, unionBy, uniqBy } from 'lodash'
import Cookie from 'vue-cookie'
import DfpCover from 'src/components/DfpCover.vue'
import FlashNews from 'src/components/FlashNews.vue'
import EditorChoice from 'src/components/EditorChoice.vue'
import Header from 'src/components/Header.vue'
import LatestArticleAside from 'src/components/LatestArticleAside.vue'
import LatestArticleFocus from 'src/components/list/LatestArticleFocus.vue'
import LatestArticleMain from 'src/components/LatestArticleMain.vue'
import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
import LiveStream from 'src/components/LiveStream.vue'
import Loading from 'src/components/Loading.vue'
import MirrorMediaTVAside from 'src/components/MirrorMediaTVAside.vue'
import VueDfpProvider from 'plate-vue-dfp/DfpProvider.vue'
import moment from 'moment'
import verge from 'verge'

const MAX_RESULT = 20
const PAGE = 1

// const debugDFP = require('debug')('CLIENT:DFP')
const debug = require('debug')('CLIENT:Home')

const fetchSSRData = store => store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'sections' ] })
  .then(() => Promise.all([
    fetchCommonData(store),
    fetchArticlesGroupedList(store),
    fetchPartners(store)
  ]))

const fetchCommonData = store => store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'posts-vue', 'projects', 'topics' ] })

const fetchEvent = (store, eventType = 'embedded') => store.dispatch('FETCH_EVENT', {
  params: {
    max_results: 1,
    where: {
      isFeatured: true,
      eventType: eventType
    }
  }
})

const fetchArticlesGroupedList = store => store.dispatch('FETCH_ARTICLES_GROUPED_LIST', { params: {}})

const fetchPartners = store => {
  const page = (get(store.state, 'partners.meta.page') || 0) + 1
  return store.dispatch('FETCH_PARTNERS', {
    params: {
      max_results: 25,
      page: page
    }
  }).then(() => {
    const amount = get(store.state, 'partners.items.length')
    const total = get(store.state, 'partners.meta.total')
    if (amount < total) {
      return fetchPartners(store)
    }
    return Promise.resolve()
  })
}

const fetchLatestArticle = (store, page) => store.dispatch('FETCH_LATESTARTICLES', {
  params: {
    max_results: MAX_RESULT,
    page,
    sort: '-publishedDate',
    where: { isAudioSiteOnly: false }
  }
})

const fetchFlashNews = (store) => {
  store.dispatch('FETCH_FLASH_NEWS', {
    params: {
      where: { 
        categories: { $in: [ CATEGORY_POLITICAL_ID, CATEGORY_CITY_NEWS_ID, CATEGORY_BUSINESS_ID, CATEGORY_LATESTNEWS_ID ] },
        isAudioSiteOnly: false
      },
      clean: 'content',
      max_results: 10,
      page: 1,
      sort: '-publishedDate'
    }
  })
}

export default {
  name: 'AppHome',
  components: {
    FlashNews,
    EditorChoice,
    LiveStream,
    Loading,
    DfpCover,
    LatestArticleAside,
    LatestArticleFocus,
    LatestArticleMain,
    LazyItemWrapper,
    MirrorMediaTVAside,
    VueDfpProvider,
    Header
  },
  asyncData ({ store }) {
    return fetchSSRData(store)
  },
  metaInfo: {
    titleTemplate: null,
    meta: [
      { name: 'robots', content: 'index' }
    ],
    link: [
      { rel: 'alternate', href: SITE_MOBILE_URL }
    ]
  },
  data () {
    return {
      DFP_ID,
      DFP_UNITS,
      // abIndicator: '',
      dfpHeaderLogoLoaded: false,
      dfpMode: 'prod',
      hasScrollLoadMore: get(this.$store, 'state.latestArticles.meta.page', PAGE) > 1,
      // isAdCoverCalledYet: false, 
      loading: false,
      page: get(this.$store, 'state.latestArticles.meta.page', PAGE),
      showDfpCoverAdFlag: false,
      showDfpCoverAd2Flag: false,
      showDfpCoverInnityFlag: false,
      showDfpHeaderLogo: false,
      verge
    }
  },
  computed: {
    articlesGroupedList () {
      return this.$store.state.articlesGroupedList
    },
    commonData () {
      return this.$store.state.commonData
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
          const loadInnityAd = () => {
            debug('Event "noad2" is detected!!')
            if (currentInstance.showDfpCoverAd2Flag && !currentInstance.showDfpCoverInnityFlag) {
              sendAdCoverGA('innity')
              debug('noad2 detected and go innity')
              currentInstance.showDfpCoverInnityFlag = true
            }
          }
          window.addEventListener('noad2', loadInnityAd)
          window.parent.addEventListener('noad2', loadInnityAd)

          switch (position) {
            case 'LMBCVR':
              sendAdCoverGA('dfp')
              if (adDisplayStatus === 'none') {
                updateCookie({ currEnv: currentInstance.dfpMode }).then((isVisited) => {
                  currentInstance.showDfpCoverAd2Flag = !isVisited
                })
              } else {
                updateCookie({ currEnv: currentInstance.dfpMode }).then((isVisited) => {
                  currentInstance.showDfpCoverAdFlag = !isVisited
                })
              }
              break
            case 'LMBCVR2':
              debug('ad2 loaded')
              sendAdCoverGA('ad2')
              adDisplayStatus === 'none' && debug('dfp response no ad2')
              break
            case 'LMBCVR3':
              debug('adInnity loaded')
              sendAdCoverGA('innity')
              adDisplayStatus === 'none' && debug('dfp response no innity')
              break
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
    },
    editorChoice () {
      return get(this.articlesGroupedList, 'choices')
    },
    eventEmbedded () {
      return get(this.$store, 'state.eventEmbedded.items.0')
    },
    eventMod () {
      return get(this.$store, 'state.eventMod.items.0')
    },
    flashNewsArticle () {
      return this.$store.state.flashNews.items || []
    },
    groupedArticle () {
      return slice(get(this.articlesGroupedList, 'grouped'))
    },
    hasEventEmbedded () {
      const _now = moment()
      const _eventStartTime = moment(new Date(get(this.eventEmbedded, 'startDate')))
      let _eventEndTime = moment(new Date(get(this.eventEmbedded, 'endDate')))
      if (_eventEndTime && (_eventEndTime < _eventStartTime)) {
        _eventEndTime = moment(new Date(get(this.eventEmbedded, 'endDate'))).add(12, 'h')
      }
      return (_eventStartTime && _eventEndTime && (_now >= _eventStartTime) && (_now <= _eventEndTime))
    },
    hasEventMod () {
      const _now = moment()
      const _eventStartTime = moment(new Date(get(this.eventMod, [ 'startDate' ])))
      let _eventEndTime = moment(new Date(get(this.eventMod, [ 'endDate' ])))
      if (_eventEndTime && (_eventEndTime < _eventStartTime)) {
        _eventEndTime = moment(new Date(get(this.eventMod, [ 'endDate' ]))).add(12, 'h')
      }
      return (_eventStartTime && _eventEndTime && (_now >= _eventStartTime) && (_now <= _eventEndTime))
    },
    latestArticlesList () {
      return get(this.$store, 'state.latestArticles.items')
    },
    latestEndIndex () {
      return get(this.$store, 'state.articlesGroupedList.latestEndIndex')
    },
    latestArticle () {
      const { articlesGroupedList, latestEndIndex, latestArticlesList } = this
      const latestFirstPage = dropRight(get(articlesGroupedList, 'latest'), 3)
      const latestAfterFirstPage = drop(latestArticlesList, latestEndIndex)
      const choices = get(articlesGroupedList, 'choices')
      const groupedTitle = get(articlesGroupedList, 'grouped')
      const groupedRelateds = flatten(map(get(articlesGroupedList, 'grouped'), o => o.relateds))
      const grouped = union(groupedTitle, groupedRelateds)
      const choicesAndGrouped = unionBy(choices, grouped, 'slug')
      const choicesAndGrouped_slugs = choicesAndGrouped.map(o => o.slug)
      const latest = uniqBy(
        concat(latestFirstPage, latestAfterFirstPage),
        'slug'
      )
      const notFirstPageNow = (get(this.$store, 'state.latestArticles.meta.page') || 1) !== 1
      remove(latest, o => includes(choicesAndGrouped_slugs, o.slug))
      return notFirstPageNow ? latest : latestFirstPage
    },
    isMobile () {
      return this.viewportWidth < 1200
    },
    viewportWidth () {
      return get(this.$store, 'state.viewport.width') || 0
    }
  },
  methods: {
    detectFixProject: function () {
      if (!this.isMobile) {
        const secondLastFocusNews = document.querySelector('aside .latest-aside-container.secondLast')
        const secondLastFocusNewsBottomPos = elmYPosition('aside .latest-aside-container.secondLast') + secondLastFocusNews.offsetHeight
        const lastFocusNews = document.querySelector('aside .latest-aside-container.last')
        const lastFocusNewsBottomPos = elmYPosition('aside .latest-aside-container.last') + lastFocusNews.offsetHeight
        const project = document.querySelector('.projectListVert')
        // const mirrorMediaTVAsideMod = document.querySelector('.mmtv-aside')
        if (project) {
          if (currentYPosition() > lastFocusNewsBottomPos) {
            project.classList.add('fixed')
          } else {
            project.classList.remove('fixed')
          }
        } else {
          if (currentYPosition() > secondLastFocusNewsBottomPos) {
            lastFocusNews.classList.add('fixed')
          } else {
            lastFocusNews.classList.remove('fixed')
          }
        }
      }
    },
    get,
    getMmid () {
      const mmid = Cookie.get('mmid')
      let assisgnedRole = get(this.$route, 'query.ab')
      if (assisgnedRole) {
        assisgnedRole = assisgnedRole.toUpperCase()
      }
      const role = getRole({ mmid, distribution: [
        { id: 'A', weight: 50 },
        { id: 'B', weight: 50 } ]
      })
      return assisgnedRole || role
    },
    initHasScrollLoadMore () {
      this.hasScrollLoadMore = false
    },
    updateSysStage () {
      this.dfpMode = currEnv()
    },
    loadMore () {
      window.ga('send', 'event', 'home', 'scroll', 'loadmore' + this.page, { location: document.location.href })
      this.page += 1
      this.loading = true

      fetchLatestArticle(this.$store, this.page).then(() => {
        this.hasScrollLoadMore = false
        this.loading = false
      })
    },
    handleScrollForLoadmore () {
      window.onscroll = () => {
        const _latestArticleDiv = document.querySelector('#latestArticle')
        if (!_latestArticleDiv) { return }
        const firstPageArticleHeight = _latestArticleDiv.offsetHeight
        const firstPageArticleBottom = elmYPosition('#latestArticle') + (firstPageArticleHeight)
        const currentBottom = currentYPosition() + window.innerHeight
        if ((currentBottom > (firstPageArticleBottom - 0)) && !this.hasScrollLoadMore) {
          this.hasScrollLoadMore = true
          this.loadMore()
        }
      }
    },
    // scrollEventHandlerForAd () {
    //   if (this.isAdCoverCalledYet) { return }
    //   const currentTop = currentYPosition()
    //   const eleTop = elmYPosition('#homepage-focus-news')
    //   const device_height = verge.viewportH()
    //   if (currentTop + device_height > eleTop) {
    //     debugDFP('SHOW ADCOVER!')
    //     this.isAdCoverCalledYet = true
    //     window.removeEventListener('scroll', this.scrollEventHandlerForAd)
    //   }
    // },
  },
  beforeMount () {
    // this.abIndicator = this.getMmid()
    const jobs = [
      fetchEvent(this.$store, 'embedded'),
      fetchEvent(this.$store, 'logo'),
      fetchEvent(this.$store, 'mod'),
    ]
    Promise.all(jobs)
  },
  mounted () {
    unLockJS()
    this.handleScrollForLoadmore()
    this.updateSysStage()

    fetchFlashNews(this.$store)
    
    window.addEventListener('scroll', this.detectFixProject)

    /**
     * Have ad-cover be rendered as soon as #homepage-focus-news gets visible.
     */
    /** 
     *  Dont show ad cover on listing page for now.     
     *  window.addEventListener('scroll', this.scrollEventHandlerForAd)
     */

    window.ga('set', 'contentGroup1', '')
    window.ga('set', 'contentGroup2', '')
    window.ga('set', 'contentGroup3', '')
    // window.ga('set', 'contentGroup3', `home${this.abIndicator}`)
    window.ga('send', 'pageview', { title: SITE_TITLE, location: document.location.href })
  },
  updated () {
    this.initHasScrollLoadMore()
    this.handleScrollForLoadmore()
    this.updateSysStage()
  },
  destroyed () {
    window.removeEventListener('scroll', this.detectFixProject)
  },
  // watch: {
  //   abIndicator: function () {
  //     this.$forceUpdate()
  //   }
  // }
}

</script>
<style lang="stylus" scoped>
.editorChoice
  // margin-top 40px
  padding-top 10px

.articleList-block
  display block

.home-view
  width 100%
  box-sizing border-box
  padding-bottom 50px 

  h2 
    margin: 0;
    font-family Noto Sans TC,sans-serif
    font-size 18px
    font-weight 700
    line-height 1.5
    letter-spacing .5px
    color rgba(0,0,0,.8)
    list-style-type none
    &.project-title--desktop
      display none
  .project-title--mobile
    padding 0 2em
    margin 10px 0
    h2
      font-size 1.5rem
      color #356d9c
      font-weight 400
      overflow hidden
      &::after
        content ""
        display inline-block
        height 0.5em
        vertical-align middle
        width 100%
        margin-right -100%
        margin-left 10px
        border-top 5px solid #356d9c
    
.list
  &.container
    width 100%

    .project-container
      margin 0 20px

    aside
      .aside-title
        // overflow hidden
        padding: 0 2rem
        margin-top 10px

        h2
          font-size 1.5rem
          color #356d9c
          font-weight 400
          overflow hidden
          margin-bottom 10px

          &::after
            content ""
            display inline-block
            height .5em
            vertical-align middle
            width 100%
            margin-right -100%
            margin-left 10px
            border-top 5px solid #356d9c

    main
      width 90%
      margin 0 auto

.home-mainContent
  width 100%
  flex-wrap wrap
  aside
    display none
  .latest-main-container
    width 90%
    margin 0 auto
  .project-container
    width 90%
    margin 0 auto
  .aside-title
    width 90%
    margin 10px auto 0

    h2
      font-size 1.5rem
      color #356d9c
      font-weight 400
      overflow hidden
      margin-bottom 10px

      &::after
        content ""
        display inline-block
        height .5em
        vertical-align middle
        width 100%
        margin-right -100%
        margin-left 10px
        border-top 5px solid #356d9c
  
section.footer
  width 100%

.projectListVert
  &.fixed
    position fixed
    top 20px
    right auto
    width calc(1024px * 0.25 - 30px)

.mmtv-aside
  &.fixed
    position fixed
    top 460px
    right auto
    width calc(1024px * 0.25 - 30px)

.focusNewsContainer
  &__latest-mobile-b
    width 90%
    margin 0 auto
    padding 14px 18px
    border solid 2px #224f73

@media (min-width: 600px)
  .list
    &.container
      width 100%
      padding 0 2rem

      .project-container
        margin 0

      aside
        display flex
        flex-wrap wrap
        justify-content space-between

        .aside-title
          width 100%
          color #356d9c
          margin-top 35px
          margin-bottom 10px
          // overflow hidden

          h2
            font-size 1.5rem
            color #356d9c

            &::after
              content ""
              display inline-block
              height .5em
              vertical-align middle
              width 100%
              margin-right -100%
              margin-left 10px
              border-top 5px solid #356d9c

      main
        width 100%

  .home-mainContent
    padding 0 2rem
    .aside-title
      width 100%
    .project-container
      width 100%
    .focusNewsContainer
      display flex
      flex-wrap wrap
      justify-content space-between
    .latest-main-container
      width 100%

  section.footer
    width 100%
    padding 0 2rem

@media (min-width: 1200px)
  .home-view
    h2
      &.project-title--desktop
        display block
        margin-bottom 10px
        color #356d9c
        font-size 1.3rem
        font-weight 400
    .project-title--mobile
      display none
    .footer
      width 1024px
      margin 70px auto 0 
  .list
    &.container
      width 1024px
      padding 0
      flex-direction row
      flex-wrap wrap
      align-items flex-start

      main
        width 75%
        #latestArticle
          margin-top 30px

      aside
        width 25%
        padding 0 30px 0 0

        .aside-title
          margin-top 0
          padding 0
          h2
            margin-bottom 0
            font-size 1.3rem
            &::after
              display none
  .editorChoice
    margin-top 0
  .home-mainContent
    display flex
    width 1024px
    // margin 40px auto 0
    margin 10px auto 0
    padding 0

    main
      width 75%
      .aside-title
        h2
          display none
    aside
      display block
      width 25%
      padding-left 30px
      .aside-title
        margin-top 0
        margin-bottom 10px
        padding 0
        h2
          margin-bottom 0
          font-size 1.3rem
          line-height 1.15
          &::after
            display none
            
    .latest-main-container
      margin-top 25px

  section.footer
    width 1024px
  
  .focusNewsContainer
    &__latest-mobile-b
      display none
    
</style>
