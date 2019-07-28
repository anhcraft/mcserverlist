import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueAxios from 'vue-axios';
import axios from 'axios';

Vue.config.productionTip = false;

Vue.use(require('vue-cookies'));
Vue.use(VueAxios, axios);

const vue = new Vue({
  router,
  render: h => h(App)
});

Vue.mixin({
  data() {
    return {
      config: {
        "server_api_url": process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://minecraftvn.net/serverapi"
      },
      logged_in: false
    }
  },
  methods: {
    ifDefined(x, defaultVal){
      return x === undefined ? defaultVal : x;
    },
    showFailedMsg(failedMsg){
      this.$notification.open({
        message: failedMsg,
        position: 'is-top-right',
        type: 'is-danger',
        hasIcon: true,
        queue: false
      });
    },
    checkLength(str, min, max, failedMsg){
      const x = str.trim();
      const s = x.length >= min && x.length <= max;
      if(!s && failedMsg !== undefined) this.showFailedMsg(failedMsg);
      return s;
    },
    checkRegex(str, regex, failedMsg){
      const s = new RegExp(regex).test(str.trim());
      if(!s && failedMsg !== undefined) this.showFailedMsg(failedMsg);
      return s;
    },
    randomColors() {
      const x = ["primary", "success", "danger", "warning", "info", "link"];
      return x[Math.floor(Math.random() * x.length)];
    },
    copy(x) {
      navigator.clipboard.writeText(x);
      this.$toast.open({
        message: 'Đã sao chép xD',
        type: 'is-info',
        queue: false
      });
    },
    restrictAccess(canAccess) {
      if (this.$parent.$data.logged_in) {
        if(canAccess !== undefined) canAccess();
      }
      else {
        this.$notification.open({
          message: 'Vui lòng đăng nhập!',
          position: 'is-bottom-right',
          type: 'is-danger',
          hasIcon: true,
          queue: false
        });
        this.$router.push("/");
      }
    },
    requestStrictApi(router, callback, data, bkCallback) {
      if (this.$cookies.isKey("uid") && this.$cookies.isKey("utk")) {
        this.axios.post(`${this.config.server_api_url + router}`, new URLSearchParams(
            Object.assign({
              uid: this.$cookies.get("uid"),
              utk: this.$cookies.get("utk")
            }, data)
        ).toString()).then((res) => callback(res)).catch((error) => {
          console.error(error);
          this.$notification.open({
            message: 'Lỗi hệ thống!',
            position: 'is-bottom-right',
            type: 'is-danger',
            hasIcon: true,
            queue: false
          });
          setTimeout(() => {
            document.body.innerHTML = "";
          }, 1000);
        });
      } else bkCallback();
    },
    callRouteUpdate(route) {
      let x = route.matched;
      if (x.length > 0) {
        x = x[0].instances.default.$data;
        if (x !== undefined) {
          x = x.on_route_update;
          if (x !== undefined) {
            x.forEach(s => s());
          }
        }
      }
    }
  }
});

vue.$mount('#app');
