<template>
  <div>
    <div class="hero pl-15 pr-15">
      <div class="hero-body">
        <div class="container">
          <header class="is-size-3 has-text-weight-medium has-text-grey">
            <b-icon icon="account is-large"></b-icon>
            Đăng nhập
          </header>
          <section class="mt-15">
            <b-field :type="{ 'is-danger': hasError }" label="Tài khoản/Email trên minecraftvn.net">
              <b-input v-model="login" required></b-input>
            </b-field>

            <b-field :type="{ 'is-danger': hasError }" label="Mật khẩu">
              <b-input v-model="password" password-reveal required type="password"></b-input>
            </b-field>

            <b-button class="mt-10 m-tt-10 m-mt-10" icon-left="check" outlined type="is-info" @click="doLogin">Xác
              nhận
            </b-button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "login",
  data() {
    return {
      login: '',
      password: '',
      hasError: false,
      errorMsg: true,
      lock: false
    }
  },
  methods: {
    doLogin() {
      if (this.lock) return;
      this.lock = true;
      const loading = this.$loading.open({
        container: null
      });
      this.axios.post(`${this.config.server_api_url}/auth/login`, new URLSearchParams(
          {
            login: this.login,
            password: this.password
          }
      ).toString()).then((res) => {
        if (res.status === 200) {
          this.hasError = res.data.code !== 2;
          if (this.hasError) {
            this.$notification.open({
              duration: 3000,
              message: res.data.code === 0 ? 'Lỗi kết nối tới forum!' : res.data.msg,
              position: 'is-bottom-right',
              type: 'is-danger',
              hasIcon: true
            });
            loading.close();
            this.lock = false;
          } else {
            this.$notification.open({
              duration: 3000,
              message: "Đăng nhập thành công",
              position: 'is-bottom-right',
              type: 'is-success',
              hasIcon: true
            });
            this.$cookies.set("uid", res.data.uid, '7d');
            this.$cookies.set("utk", res.data.utk, '7d');
            loading.close();
            this.lock = false;
            setTimeout(() => {
              this.$parent.$data.logged_in = true;
              this.$router.push("/");
            }, 800);
          }
        } else {
          this.$notification.open({
            duration: 3000,
            message: 'Lỗi API! Vui lòng liên hệ admin.',
            position: 'is-bottom-right',
            type: 'is-danger',
            hasIcon: true
          });
          loading.close();
          this.lock = false;
        }
      }).catch((error) => {
        console.error(error)
      });
    }
  },
  head: {
    title: function () {
      return {
        inner: "MCVNServerList",
        complement: "Đăng nhập"
      }
    },
    link: [
      {rel: 'stylesheet', href: 'https://cdn.materialdesignicons.com/3.8.95/css/materialdesignicons.min.css'}
    ]
  }
}
</script>
