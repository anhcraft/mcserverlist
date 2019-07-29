<template>
  <div id="app">
    <nav class="navbar is-fixed-top is-dark is-size-7 is-uppercase" role="navigation">
      <div class="navbar-brand">
        <a class="navbar-item" href="https://bulma.io">
          <img src="https://minecraftvn.net/styles/io/io/images/logo.png" alt="Favicon" style="max-height:33px">
        </a>
        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" v-bind:class="{'is-active': showBurgerNavbar}" v-on:click="showBurgerNavbar = !showBurgerNavbar">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div class="navbar-menu" v-bind:class="{'is-active': !showBurgerNavbar}">
        <div class="navbar-start">
          <a class="navbar-item" href="https://minecraftvn.net/">
            <b-icon icon="home"></b-icon>&nbsp;&nbsp;&nbsp;Diễn đàn
          </a>
          <router-link tag="a" to="/" class="navbar-item">
            <b-icon icon="table"></b-icon>&nbsp;&nbsp;&nbsp;Danh sách máy chủ
          </router-link>
          <!--
          <router-link tag="a" to="/ranking/" class="navbar-item">
            <b-icon icon="chart-bar"></b-icon>&nbsp;&nbsp;&nbsp;Bảng xếp hạng
          </router-link>
          -->
          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link"><b-icon icon="account"></b-icon>&nbsp;&nbsp;&nbsp;Tài khoản</a>
            <div class="navbar-dropdown">
              <router-link tag="a" to="/dashboard/" class="navbar-item" v-if="logged_in">
                <b-icon icon="monitor-dashboard"></b-icon>&nbsp;&nbsp;&nbsp;Bảng điều khiển
              </router-link>
              <router-link tag="a" to="/logout/" class="navbar-item" v-if="logged_in">
                <b-icon icon="logout"></b-icon>&nbsp;&nbsp;&nbsp;Đăng xuất
              </router-link>
              <router-link tag="a" to="/login/" class="navbar-item" v-else>
                <b-icon icon="login"></b-icon>&nbsp;&nbsp;&nbsp;Đăng nhập
              </router-link>
            </div>
          </div>
        </div>
        <div class="navbar-end pr-15 p-tr-15 p-mr-15">
          <a href="https://github.com/anhcraft/mcserverlist">
            <b-taglist class="has-text-centered mt-15 m-tt-15 m-mt-15" style="display:block" attached>
              <b-tag type="is-white">Phiên bản</b-tag>
              <b-tag type="is-info">BETA 6</b-tag>
            </b-taglist>
          </a>
        </div>
      </div>
    </nav>
    <div class="columns">
      <div class="column container is-full-mobile pt-70 pr-50 p-tt-70 p-tr-10 p-mt-70 p-mr-10 pb-50 p-mb-50 p-tb-50">
        <router-view/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import Buefy from 'buefy';

  Vue.use(Buefy);

  export default {
    data() {
      return {
        showBurgerNavbar: false
      }
    },
    methods: {
      doAuth(r){
        Vue.nextTick().then(() => {
          this.requestStrictApi("/auth/check", (res) => {
            this.$data.logged_in = res.data.logged_in;
            Vue.nextTick().then(() => {
              this.callRouteUpdate(r);
            })
          }, {}, () => this.callRouteUpdate(r));
        });
      }
    },
    mounted () {
      this.doAuth(this.$route);
    },
    watch: {
      '$route': function(to) {
        this.doAuth(to);
      }
    }
  }
</script>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css?family=Quicksand:300,400,500,600,700&display=swap&subset=vietnamese');

  // Colors
  $black:        hsl(0, 0%, 4%) !default
  $black-bis:    hsl(0, 0%, 7%) !default
  $black-ter:    hsl(0, 0%, 14%) !default

  $grey-darker:  hsl(0, 0%, 21%) !default
  $grey-dark:    hsl(0, 0%, 29%) !default
  $grey:         hsl(0, 0%, 48%) !default
  $grey-light:   hsl(0, 0%, 71%) !default
  $grey-lighter: hsl(0, 0%, 86%) !default

  $white-ter:    hsl(0, 0%, 96%) !default
  $white-bis:    hsl(0, 0%, 98%) !default
  $white:        hsl(0, 0%, 100%) !default

  $orange:       hsl(14,  100%, 53%) !default
  $yellow:       hsl(48,  100%, 67%) !default
  $green:        hsl(141, 71%,  48%) !default
  $turquoise:    hsl(171, 100%, 41%) !default
  $cyan:         hsl(204, 86%,  53%) !default
  $blue:         hsl(217, 71%,  53%) !default
  $purple:       hsl(271, 100%, 71%) !default
  $red:          hsl(348, 100%, 61%) !default

  // Typography
  $family-sans-serif: 'Quicksand', sans-serif;
  $family-monospace: monospace !default
  $render-mode: optimizeLegibility !default

  $size-1: 3rem !default
  $size-2: 2.5rem !default
  $size-3: 2rem !default
  $size-4: 1.5rem !default
  $size-5: 1.25rem !default
  $size-6: 1rem !default
  $size-7: 0.75rem !default

  $weight-light: 300 !default
  $weight-normal: 400 !default
  $weight-medium: 500 !default
  $weight-semibold: 600 !default
  $weight-bold: 700 !default

  // Spacing
  $block-spacing: 1.5rem !default

  // Responsiveness
  // The container horizontal gap, which acts as the offset for breakpoints
  $gap: 32px !default
  // 960, 1152, and 1344 have been chosen because they are divisible by both 12 and 16
  $tablet: 769px !default
  // 960px container + 4rem
  $desktop: 960px + (2 * $gap) !default
  // 1152px container + 4rem
  $widescreen: 1152px + (2 * $gap) !default
  $widescreen-enabled: true !default
  // 1344px container + 4rem
  $fullhd: 1344px + (2 * $gap) !default
  $fullhd-enabled: true !default

  // Miscellaneous
  $easing: ease-out !default
  $radius-small: 2px !default
  $radius: 4px !default
  $radius-large: 6px !default
  $radius-rounded: 290486px !default
  $speed: 86ms !default

  // Flags
  $variable-columns: true !default

  @import "~bulma/sass/utilities/_all";
  @import "~bulma";
  @import "~buefy/src/scss/buefy";

  $sizes: (5,10,15,20,25,30,35,40,45,50,60,70,80,90,100);
  $positions: ('top','left','bottom','right');

  // mobile
  @media screen and (max-width: $tablet - 1px) {
    @each $size in $sizes {
      .m-m-#{$size} {
        margin: $size + px !important;
      }
      .p-m-#{$size} {
        padding: $size + px !important;
      }
      @each $position in $positions {
        .m-m#{str-slice($position, 0, 1)}-#{$size} {
          margin-#{$position}: $size + px !important;
        }
        .p-m#{str-slice($position, 0, 1)}-#{$size} {
          padding-#{$position}: $size + px !important;
        }
      }
    }
  }

  // tablet
  @media screen and (min-width: $tablet) {
    @each $size in $sizes {
      .m-t-#{$size} {
        margin: $size + px !important;
      }
      .p-t-#{$size} {
        padding: $size + px !important;
      }
      @each $position in $positions {
        .m-t#{str-slice($position, 0, 1)}-#{$size} {
          margin-#{$position}: $size + px !important;
        }
        .p-t#{str-slice($position, 0, 1)}-#{$size} {
          padding-#{$position}: $size + px !important;
        }
      }
    }
  }

  // desktop
  @media screen and (min-width: $desktop) {
    @each $size in $sizes {
      .m-#{$size} {
        margin: $size + px !important;
      }
      .p-#{$size} {
        padding: $size + px !important;
      }
      @each $position in $positions {
        .m#{str-slice($position, 0, 1)}-#{$size} {
          margin-#{$position}: $size + px !important;
        }
        .p#{str-slice($position, 0, 1)}-#{$size} {
          padding-#{$position}: $size + px !important;
        }
      }
    }
  }

  .menu-list a:hover{
    color: $link;
  }

  body {
    width: 100%;
    height: 100%;
    position: absolute;
  }
</style>
