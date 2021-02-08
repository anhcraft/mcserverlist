<template>
  <div>
    <div class="hero pl-15 pr-15">
      <div class="hero-body">
        <div class="container">
          <header class="is-size-3 has-text-weight-medium has-text-grey">
            <b-icon icon="account is-large"></b-icon>
            Đăng xuất
          </header>
          <section class="mt-15">
            <p>Bạn có chắc chắn muốn đăng xuất không?</p>

            <div class="buttons mt-35">
              <b-button class="mt-10 m-tt-10 m-mt-10" icon-left="check" outlined type="is-success"
                        @click="confirmLogout">Có
              </b-button>
              <b-button class="mt-10 m-tt-10 m-mt-10" icon-left="close" outlined type="is-danger" @click="cancelLogout">
                Không
              </b-button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "logout",
  data() {
    return {
      lock: false
    }
  },
  methods: {
    cancelLogout() {
      this.$router.back();
    },
    confirmLogout() {
      if (this.lock) return;
      this.lock = true;
      const loading = this.$loading.open({
        container: null
      });
      this.requestStrictApi("/auth/logout", (res) => {
        if (res.status === 200 && res.data.code === 1) {
          this.$notification.open({
            duration: 3000,
            message: "Đăng xuất thành công",
            position: 'is-bottom-right',
            type: 'is-success',
            hasIcon: true
          });
          this.$cookies.remove("uid");
          this.$cookies.remove("utk");
          loading.close();
          this.lock = false;
          setTimeout(() => {
            this.$parent.$data.logged_in = false;
            this.$router.push("/");
          }, 800);
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
      });
    }
  },
  head: {
    title: function () {
      return {
        inner: "MCVNServerList",
        complement: "Đăng xuất"
      }
    },
    link: [
      {rel: 'stylesheet', href: 'https://cdn.materialdesignicons.com/3.8.95/css/materialdesignicons.min.css'}
    ]
  }
}
</script>
