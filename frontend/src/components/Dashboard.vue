<template>
  <div>
    <div class="hero pl-15 pr-15">
      <div class="hero-body">
        <div class="container">
          <header class="is-size-3 has-text-weight-medium has-text-grey">
            <b-icon icon="table is-large"></b-icon>
            Bảng điều khiển
          </header>
          <section class="mt-15">
            <b-button class="mt-10 m-tt-10 m-mt-10" icon-left="login" size="is-small" tag="router-link" to="/dashboard/new/"
                      type="is-info">Thêm máy chủ
            </b-button>
            <b-table :data="servers" :loading="isLoading" class="mt-45" default-sort="createdDate"
                     default-sort-direction="desc">
              <template slot-scope="props">
                <b-table-column field="name" label="Tên máy chủ" sortable>
                  {{ props.row.name }}
                </b-table-column>

                <b-table-column field="ip" label="IP/Host" sortable>
                  {{ props.row.ip }}
                </b-table-column>

                <b-table-column centered field="port" label="Port" numeric sortable>
                  {{ props.row.port }}
                </b-table-column>

                <b-table-column centered field="creationDate" label="Thời gian tạo" numeric sortable>
                  {{ require('moment')(props.row.createdDate).locale("vi-vn").fromNow() }}
                </b-table-column>

                <b-table-column centered field="creator" label="Người tạo" numeric sortable>
                  <a :href="`https://minecraftvn.net/members/${props.row.creator}/`"
                     target="_blank">{{ props.row.creator }}</a>
                </b-table-column>

                <b-table-column centered field="modify" label="Tùy chỉnh">
                  <div class="buttons">
                    <b-button :to="'/dashboard/edit/' + props.row.id" icon-left="pencil"
                              size="is-small"
                              tag="router-link" type="is-primary">Sửa
                    </b-button>

                    <b-button icon-left="delete" size="is-small"
                              type="is-danger" v-on:click="confirmRemove(props.row.name, props.row.id)">Xóa
                    </b-button>
                  </div>
                </b-table-column>
              </template>

              <template slot="empty">
                <section class="section">
                  <div class="content has-text-grey has-text-centered">
                    <p>
                      <b-icon icon="emoticon-sad" size="is-large"></b-icon>
                    </p>
                    <p>Bạn chưa có máy chủ nào.</p>
                  </div>
                </section>
              </template>

              <template v-if="servers.length > 0 && available" slot="footer">
                <b-button class="is-pulled-right" icon-left="chevron-down" size="is-small" type="is-dark"
                          @click="loadServers">Hiển thị thêm
                </b-button>
              </template>
            </b-table>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "dashboard",
  data() {
    return {
      servers: [],
      isLoading: false,
      on_route_update: [
        () => this.auth()
      ],
      available: false,
      from_index: 0,
      lock: false
    }
  },
  methods: {
    auth() {
      this.restrictAccess(() => this.loadServers());
    },
    loadServers() {
      if (this.lock || this.isLoading) return;
      this.isLoading = true;
      this.requestStrictApi("/server/get", (res) => {
        if (res.data.code >= 1) {
          this.servers = this.servers.concat(res.data.servers);
          this.from_index += res.data.servers.length;
          this.available = res.data.code === 2;
        }
        this.isLoading = false;
      }, {
        params: "id,name,ip,port,createdDate,creator",
        from: this.from_index
      });
    },
    confirmRemove(name, id) {
      this.$dialog.confirm({
        title: 'Xác nhận',
        message: `Bạn có chắc chắn muốn xóa máy chủ <b>${name}</b> không?`,
        confirmText: 'Có',
        cancelText: 'Không',
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => {
          this.lock = true;
          const loading = this.$loading.open({
            container: null
          });
          this.requestStrictApi("/server/remove/" + id, (res) => {
            loading.close();
            this.lock = false;
            if (res.status === 200 && res.data.code > 0) {
              if (res.data.code === 2) {
                this.$notification.open({
                  duration: 3000,
                  type: 'is-success',
                  message: 'Xóa thành công!',
                  position: 'is-bottom-right',
                  hasIcon: true
                });
                this.servers = this.servers.filter(x => {
                  return x.id !== id
                });
              } else {
                this.$notification.open({
                  position: 'is-bottom-right',
                  type: 'is-danger',
                  duration: 3000,
                  message: res.data.msg,
                  hasIcon: true
                });
              }
            } else {
              this.$notification.open({
                duration: 3000,
                type: 'is-danger',
                position: 'is-bottom-right',
                message: 'Lỗi API! Vui lòng liên hệ admin.',
                hasIcon: true
              });
            }
          });
        }
      })
    }
  },
  head: {
    title: function () {
      return {
        inner: "MCVNServerList",
        complement: "Bảng điều khiển"
      }
    },
    link: [
      {rel: 'stylesheet', href: 'https://cdn.materialdesignicons.com/3.8.95/css/materialdesignicons.min.css'}
    ]
  }
}
</script>
