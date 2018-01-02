<template>
  <section class="articleBodyExternal">
    <div class="articleBodyExternalContainer">
      <div class="articleBodyExternal__heroImage">
        <img v-if="heroImage" v-lazy="heroImage">
      </div>
      <article class="article">
        <div class="article__info">
          <div class="article__info--section">校園</div>
          <div class="article__info--date" v-text="date"></div>
        </div>
        <h1 v-text="title"></h1>
        <div v-if="credit" class="article__credit">文｜<span v-text="credit"></span></div>
        <main>
          <section class="article__main">
            <p class="article__main--brief" v-text="brief"></p>
            <div class="article__main--content" v-html="content"></div>
            <newsletter></newsletter>
            <div class="article__main--fbPage">
              <div class="fb-page" data-href="https://www.facebook.com/mirrormediamg/" data-adapt-container-width="true" data-small-header="true" data-hide-cover="true" data-show-facepile="false">
                <blockquote cite="https://www.facebook.com/mirrormediamg/" class="fb-xfbml-parse-ignore">
                  <a href="https://www.facebook.com/mirrormediamg/">鏡週刊</a>
                </blockquote>
              </div>
            </div>
            <div class="herbsapi">
              <div id="herbsapi" hb-width="100" hb-height="auto" hb-icon="https://mediafarmers.org/api/images/icon_2.png"></div>
              <div>喜歡這篇文章嗎？<br>歡迎灌溉支持喔！</div>
            </div>
            <slot name="recommendList"></slot>
            <slot name="dfp-MBE1"></slot>
            <slot name="dfp-PCE1E2"></slot>
            <slot name="popularList"></slot>
            <slot name="projectList"></slot>
            <slot name="fbComment"></slot>
          </section>
          <section class="article__aside">
            <slot name="dfp-PCR1"></slot>
            <slot name="latestList"></slot>
            <slot name="dfp-PCR2"></slot>
            <div class="article__aside--fbPage">
              <div class="fb-page" data-href="https://www.facebook.com/mirrormediamg/" data-adapt-container-width="true" data-small-header="true" data-hide-cover="true" data-show-facepile="false">
                <blockquote cite="https://www.facebook.com/mirrormediamg/" class="fb-xfbml-parse-ignore">
                  <a href="https://www.facebook.com/mirrormediamg/">鏡週刊</a>
                </blockquote>
              </div>
            </div>
            <slot name="articleAsideFixed"></slot>
          </section>
          <slot name="footer"></slot>
        </main>
      </article>
    </div>
  </section>
</template>

<script>
  import _ from 'lodash'
  import Newsletter from '../../components/Newsletter.vue'
  import moment from 'moment'

  export default {
    name: 'ArticleBodyExternal',
    components: {
      'newsletter': Newsletter
    },
    props: {
      articleData: {
        type: Object,
        required: true
      }
    },
    computed: {
      brief () {
        return _.get(this.articleData, [ 'brief' ])
      },
      content () {
        const orig = _.get(this.articleData, [ 'content' ])
        if (orig.includes('<p>')) {
          return orig
        }
        const addTagContent = _.join(_.map(_.split(orig, `\r\n\r\n`), p => `<p>${p}</p>`), '')
        return addTagContent
      },
      credit () {
        const author = _.uniq(_.split(_.get(this.articleData, [ 'extendByline' ]), ','))
        return _.map(author, a => a).join('、')
      },
      date () {
        const { publishedDate = '' } = this.articleData
        const normalizedDt = new Date(publishedDate)
        const datetime = moment(normalizedDt).format('YYYY.MM.DD HH:mm')
        return datetime
      },
      heroImage () {
        const link = _.get(this.articleData, [ 'thumb' ])
        if (link) {
          return link
        }
        return
      },
      title () {
        return _.get(this.articleData, [ 'title' ])
      }
    }
  }
</script>

<style lang="stylus">

.articleBodyExternal
  width 100%
  font-family "Noto Sans TC", STHeitiTC-Light, "Microsoft JhengHei", sans-serif
  &Container
    width 100%
    background-color #fff
  &__heroImage
    width 100%
    font-size 0
    img 
      width 100%
  .article
    max-width 100%
    padding 30px 25px 0
    h1
      margin 15px 0
      font-size 2.2rem
      font-weight 400
      text-align justify
    &__info
      display flex
      justify-content space-between
      align-items flex-end
      &--section
        padding-left 10px
        font-size 1.3rem
        border-left 7px solid #ee5a24
      &--date
        color #a1a1a1
        font-size 1rem
        font-style italic
        font-weight normal
    &__main
      margin-top 30px
      &--brief
        color #08639e
        text-align justify
        font-weight bold
        font-size 1.2rem
        line-height 36px
      &--content
        p
          font-weight 400
        h2
          margin-top 40px
          color #000
          font-weight bolder
        p
          margin 1.5em 0
          color #171717
          font-size 18px
          line-height 36px
          text-align justify
        a, a:hover, a:link, a:visited
          padding-bottom 5px
          color #3195b3
          text-decoration none
          border-bottom 1px solid #3195b3
          cursor pointer
          
        img 
          width 100%
        .picture-box
          p
            margin 10px 0
            color rgba(0,0,0,0.498)
            font-size 15px
            line-height 1.7
            letter-spacing 0.3px
      &--fbPage
        width 100%
        margin-top 15px

      .herbsapi
        display flex
        align-items center
        padding 15px 0
        margin 15px 0
        border-top 1px solid rgba(2,2,2,0.5)
        border-bottom 1px solid rgba(2,2,2,0.5)
        br
          display none

      #herbsapi
        height 40px
        margin-right 20px
        > a
          display inline-block
          padding 0
          font-size 0
          border none
      
      .fbComment
        margin 1.5em 0
      
      h3
        font-size 26px

    .footer
      padding-left 0
      padding-right 0

    &__aside
      display none

@media (min-width 500px)
  .articleBodyExternal
    .article
      padding 30px 50px 0

@media (min-width 768px)
  .articleBodyExternal
    .article
      width 645px
      padding 50px 0 0
      margin 0 auto

@media (min-width 900px)
  .articleBodyExternal
    .article
      width 695px

@media (min-width 1200px)
  .articleBodyExternal
    background-color #414141
    &Container
      width 1160px
      margin 0 auto
    .article
      width 100%
      padding 30px 50px 0
      main
        display flex
        flex-wrap wrap
        justify-content space-between
        align-items flex-start
      &__main
        width 695px
        margin-top 30px
        > p:first-of-type
          margin-top 0
        &--fbPage
          display none
      &__aside
        display block
        margin-top 10px
        &--fbPage
          margin-top 20px
      .popularList
        display none
      .footer
        width 100%
    

</style>