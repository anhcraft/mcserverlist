<template>
  <div>
    <div class="hero pl-15 pr-15">
      <div class="hero-body">
        <div class="container">
          <header class="is-size-3 has-text-weight-medium has-text-grey">
            <b-icon icon="server is-large"></b-icon>
            Máy chủ mới
          </header>
          <section class="mt-15">
            <b-field label="Tên máy chủ">
              <b-input v-model="serverName" required></b-input>
            </b-field>

            <b-field label="Gắn thẻ">
              <b-taginput v-model="serverTags" :data="filteredTags" autocomplete icon="label" maxtags="10"
                          placeholder="Thêm thẻ" type="is-warning" @typing="suggestTags"></b-taginput>
            </b-field>

            <b-field grouped>
              <b-field expanded label="IP/Host">
                <b-input v-model="serverIp"
                         pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$"
                         placeholder="hypixel.net"
                         required validation-message="Vui lòng nhập đúng định dạng tên miền hoặc IP!"></b-input>
              </b-field>

              <b-field label="Port">
                <b-numberinput v-model="serverPort" max="65535" min="1"></b-numberinput>
              </b-field>
            </b-field>

            <b-field>
              <b-tooltip
                  label="Sử dụng một IP khác dành riêng cho việc truy vấn dữ liệu trực tiếp (Ví dụ: lượng người chơi, biểu tượng máy chủ,...). IP này sẽ không bao giờ được gửi cho người chơi!"
                  multilined position="is-right" size="is-small" type="is-dark">
                <b-switch v-model="useDifferentPingAddress" size="is-small" type="is-success">
                  Sử dụng địa chỉ khác để truy vấn
                </b-switch>
              </b-tooltip>
            </b-field>

            <b-field v-if="useDifferentPingAddress" grouped>
              <b-field expanded label="Host truy vấn">
                <b-input v-model="serverPingIp"
                         pattern="^(([A-Za-z]|[^0-9][A-Za-z0-9\-]\.)+([A-Za-z]|[^0-9][A-Za-z0-9\-])+)$"
                         placeholder="mc.hypixel.net"
                         required validation-message="Vui lòng nhập đúng định dạng tên miền!"></b-input>
              </b-field>

              <b-field v-if="useDifferentPingAddress" label="Port">
                <b-numberinput v-model="serverPingPort" max="65535" min="1"></b-numberinput>
              </b-field>
            </b-field>

            <p v-if="useDifferentPingAddress" class="is-size-7">
              <b>Chú ý:</b> Vì lí do tránh fake truy vấn, bạn chỉ có thể dùng host (ví dụ <i>mc.minecraft.net</i> hay
              <i>hypixel.vn</i>). Ngoài ra, host truy vấn và host máy chủ phải cùng tên miền (ví dụ như
              <i>mc.abc.xyz</i> và <i>abc.xyz</i>)
              <br/><br/><br/>
            </p>

            <b-field label="Giới thiệu về máy chủ">
              <b-input v-model="serverIntro" required rows="15" type="textarea"></b-input>
            </b-field>
            <p class="is-size-7">
              Bạn có thể dùng Markdown để định dạng cho bài viết!<br>
              Hưỡng dẫn: <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet" target="_blank">https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet</a><br>
              Công cụ viết Markdown:<br>
              <a href="https://pandao.github.io/editor.md/en.html" target="_blank">https://pandao.github.io/editor.md/en.html</a><br/>
              hoặc <a href="https://jbt.github.io/markdown-editor/" target="_blank">https://jbt.github.io/markdown-editor/</a><br>
              Bạn cũng có thể dùng HTML để viết. Tuy nhiên sẽ có một số tính năng sẽ bị hạn chế.<br>
              Công cụ viết HTML: <br>
              <a href="https://html5-editor.net/" target="_blank">https://html5-editor.net/</a><br/>
              Để xuống dòng, hãy viết <b>&lt;br&gt;</b>
            </p>
            <br/>

            <b-field label="Trang web (Không bắt buộc)">
              <b-input v-model="serverWebsite"></b-input>
            </b-field>

            <b-button class="mt-10 m-tt-10 m-mt-10" icon-left="check" outlined type="is-info" @click="create">Xác nhận
            </b-button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const servertags = require('../assets/servertags.json');

export default {
  name: "newserver",
  data() {
    return {
      useDifferentPingAddress: false,
      serverName: '',
      serverIp: '',
      serverPort: 25565,
      serverPingIp: '',
      serverPingPort: 25565,
      serverIntro: '',
      serverWebsite: '',
      serverTags: [],
      filteredTags: servertags.tags,
      hasError: false,
      errorMsg: true,
      lock: false,
      on_route_update: [
        () => this.auth()
      ]
    }
  },
  methods: {
    auth() {
      this.restrictAccess();
    },
    suggestTags(text) {
      this.filteredTags = servertags.tags.filter((t) => {
        return t.toLowerCase().indexOf(text.toLowerCase()) >= 0
      });
    },
    create() {
      // validate
      if (!this.checkLength(this.serverName, 3, 25, 'Tên máy chủ phải từ 3 đến 25 kí tự')) return;
      if (!this.checkLength(this.serverIp, 6, 15, 'Ip/Host máy chủ phải từ 6 đến 15 kí tự')) return;
      if (!this.checkRegex(this.serverIp, '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\\-]*[A-Za-z0-9])$', 'Ip/Host không hợp lệ!')) return;
      if (!this.checkLength(this.serverIntro, 30, 10000, 'Nội dung giới thiệu máy chủ phải từ 30 đến 10000 kí tự')) return;
      if (this.serverWebsite.length > 0 && !this.checkRegex(this.serverWebsite, '^(http|https):\\/\\/(([a-zA-Z0-9$\\-_.+!*\'(),;:&=]|%[0-9a-fA-F]{2})+@)?(((25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])(\\.(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])){3})|localhost|([a-zA-Z0-9\\-\u00C0-\u017F]+\\.)+([a-zA-Z]{2,}))(:[0-9]+)?(\\/(([a-zA-Z0-9$\\-_.+!*\'(),;:@&=]|%[0-9a-fA-F]{2})*(\\/([a-zA-Z0-9$\\-_.+!*\'(),;:@&=]|%[0-9a-fA-F]{2})*)*)?(\\?([a-zA-Z0-9$\\-_.+!*\'(),;:@&=\\/?]|%[0-9a-fA-F]{2})*)?(\\#([a-zA-Z0-9$\\-_.+!*\'(),;:@&=\\/?]|%[0-9a-fA-F]{2})*)?)?$', 'Địa chỉ trang web không hợp lệ!')) return;
      if (this.useDifferentPingAddress) {
        if (!this.checkRegex(this.serverPingIp, '^(([A-Za-z]|[^0-9][A-Za-z0-9\\-]\\.)+([A-Za-z]|[^0-9][A-Za-z0-9\\-])+)$', 'Host truy vấn không hợp lệ!')) return;
        const a_ = this.serverIp.split(".");
        const b_ = this.serverPingIp.split(".");
        if (a_.length < 2 || b_.length < 2 || a_[a_.length - 1] !== b_[b_.length - 1] || a_[a_.length - 2] !== b_[b_.length - 2]) {
          this.showFailedMsg("Host máy chủ và host truy vấn không cùng tên miền!");
          return;
        }
      }

      if (this.lock) return;
      this.lock = true;
      const loading = this.$loading.open({
        container: null
      });
      this.requestStrictApi("/server/create", (res) => {
        if (res.status === 200) {
          this.hasError = res.data.code !== 2;
          if (this.hasError) {
            this.$notification.open({
              duration: 3000,
              message: res.data.code === 0 ? 'Lỗi API! Vui lòng liên hệ admin.' : res.data.msg,
              position: 'is-bottom-right',
              type: 'is-danger',
              hasIcon: true
            });
            loading.close();
            this.lock = false;
          } else {
            this.$notification.open({
              duration: 3000,
              message: "Thêm máy chủ thành công",
              position: 'is-bottom-right',
              type: 'is-success',
              hasIcon: true
            });
            setTimeout(() => {
              this.lock = false;
              loading.close();
              this.$router.push("/dashboard/");
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
      }, {
        ip: this.serverIp,
        name: this.serverName,
        port: this.serverPort,
        intro: this.serverIntro,
        website: this.serverWebsite,
        tags: this.serverTags,
        diffPing: this.useDifferentPingAddress,
        pingIp: this.useDifferentPingAddress ? this.serverPingIp : "",
        pingPort: this.useDifferentPingAddress ? this.serverPingPort : 25565
      });
    }
  },
  head: {
    title: function () {
      return {
        inner: "MCVNServerList",
        complement: "Thêm máy chủ"
      }
    },
    link: [
      {rel: 'stylesheet', href: 'https://cdn.materialdesignicons.com/3.8.95/css/materialdesignicons.min.css'}
    ]
  }
}
</script>
