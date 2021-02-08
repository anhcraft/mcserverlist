<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head has-background-grey-dark">
      <p class="modal-card-title has-text-light">{{ serverViewData.server.name }}</p>
    </header>
    <section class="modal-card-body">
      <iframe :srcdoc="serverViewData.intro" sandbox style="width: 100%; height: 100%;"></iframe>
    </section>
    <footer class="modal-card-foot" style="display:block">
      <div class="columns">
        <div class="column is-3">
          <p class="is-size-5 has-text-weight-medium mb-15 m-tb-15 m-mb-15">IP</p>
          <b-tooltip label="Nhấn vào để sao chép" multilined position="is-top" size="is-small" type="is-dark">
            <b-button icon-right="content-copy" size="is-small"
                      v-on:click="copy(serverViewData.server.ip + ':' + serverViewData.server.port)">
              {{ serverViewData.server.ip }}<span
                v-if="serverViewData.server.port !== 25565">:{{ serverViewData.server.port }}</span>
            </b-button>
          </b-tooltip>
        </div>
        <div class="column is-5">
          <p class="is-size-5 has-text-weight-medium mb-15 m-tb-15 m-mb-15">Thẻ</p>
          <b-taglist>
            <template v-for="tag in serverViewData.server.tags.split(',')" v-if="tag.length > 0">
              <span :class="'tag is-' + randomColors()">{{ tag }}</span>
            </template>
          </b-taglist>
        </div>
        <div class="column">
          <div class="columns">
            <div class="column is-3">
              <img :src="serverViewData.server.ping.result.icon" alt="Biểu tượng" style="max-width:64px"/>
            </div>
            <div class="column">
              Đã tạo {{ require('moment')(serverViewData.server.createdDate).locale("vi-vn").fromNow() }}
              <div v-if="serverViewData.server.website.length > 0">
                Trang web: <a :href="serverViewData.server.website" target="_blank">{{
                  serverViewData.server.website
                }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "ViewServer",
  props: ['serverViewData']
}
</script>
