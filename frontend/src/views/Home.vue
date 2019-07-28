<template>
    <div>
        <section class="hero is-primary is-bold">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title">
                        Minecraft Server List
                    </h1>
                    <h2 class="subtitle">
                        Viet Nam
                    </h2>
                </div>
            </div>
        </section>
        <section class="mt-45 m-tt-25 m-mt-15">
            <header class="is-size-4">
                <b-icon icon="table is-large"></b-icon> DANH SÁCH MÁY CHỦ
            </header>

            <b-table :data="servers" :loading="isLoading" default-sort-direction="desc" default-sort="createdDate" class="mt-45">
                <template slot-scope="props">
                    <b-table-column field="name" label="Máy chủ" sortable>
                        <div class="columns is-centered" style="cursor:pointer">
                            <div class="column is-3">
                                <b-tooltip label="Nhấn vào để xem thêm về máy chủ này" size="is-small" multilined type="is-dark" position="is-left">
                                    <img v-on:click="view(props.row)" :src="props.row.query.icon" alt="Biểu tượng" style="max-width:64px"/>
                                </b-tooltip>
                            </div>
                            <div class="column">
                                <b-tooltip label="Nhấn vào để xem thêm về máy chủ này" size="is-small" multilined type="is-dark" position="is-left">
                                    <span v-on:click="view(props.row)">
                                        <span v-if="props.row.query.online" class="has-text-success">
                                            <b-icon icon="check-decagram" size="is-small"></b-icon>
                                        </span>
                                        <span class="has-text-danger" v-else>
                                            <b-icon icon="alert" size="is-small"></b-icon>
                                        </span>
                                        <b :class="'is-size-5 has-text-weight-medium ml-5 m-ml-5 m-tl-5 has-text-' + randomColors()">{{ props.row.name }}</b>
                                    </span>
                                </b-tooltip>
                                <br/>
                                <b-tooltip label="Nhấn vào để sao chép" size="is-small" multilined type="is-dark" position="is-top">
                                    <span v-on:click="copy(props.row.ip + ':' + props.row.port)" class="mt-15 m-tt-15 m-mt-15">
                                        <b-taglist attached>
                                            <b-tag class="is-dark">IP:</b-tag>
                                            <b-tag>
                                                    {{props.row.ip}}<span v-if="props.row.port !== 25565">:{{props.row.port}}</span>
                                                <b-icon icon-right="content-copy" size="is-small"></b-icon>
                                            </b-tag>
                                        </b-taglist>
                                    </span>
                                </b-tooltip>
                                <br/><br/>
                            </div>
                        </div>
                    </b-table-column>

                    <b-table-column field="tags" label="Thẻ" width="300" sortable>
                        <b-taglist>
                            <template v-for="tag in props.row.tags.split(',')" v-if="tag.length > 0">
                                <span :class="'tag is-' + randomColors()">{{ tag }}</span>
                            </template>
                        </b-taglist>
                    </b-table-column>

                    <b-table-column field="query.players.online" label="Người chơi" sortable>
                        <span v-if="props.row.query.online">
                            <b-icon icon="account-group" size="is-small"></b-icon> {{ props.row.query.players.online }}/{{ props.row.query.players.max }}
                        </span>
                    </b-table-column>
                </template>

                <template slot="empty">
                    <section class="section">
                        <div class="content has-text-grey has-text-centered">
                            <p>
                                <b-icon icon="emoticon-sad" size="is-large"></b-icon>
                            </p>
                            <p>Hiện chưa có máy chủ nào.</p>
                        </div>
                    </section>
                </template>

                <template slot="footer" v-if="servers.length > 0 && available && !lock">
                    <b-button class="is-pulled-right" size="is-small" type="is-dark" icon-left="chevron-down" @click="loadServers">Hiển thị thêm</b-button>
                </template>
            </b-table>
        </section>

        <b-loading :active.sync="loadingExtra"></b-loading>

        <b-modal :active.sync="isModalActive" has-modal-card full-screen>
            <ViewServer :serverViewData="serverViewData"></ViewServer>
        </b-modal>
    </div>
</template>

<script>
import ViewServer from "../components/ViewServer";

export default {
    name: 'home',
    components: {
        ViewServer
    },
    data() {
        return {
            isModalActive: false,
            loadingExtra: false,
            servers: [],
            available: false,
            isLoading: true,
            on_route_update: [
                () => this.loadServers()
            ],
            from_index: 0,
            lock: false,
            server_extra_data: {},
            serverViewData: {
                intro: '',
                website: ''
            }
        }
    },
    methods: {
        view(data){
            if(this.server_extra_data.hasOwnProperty(data.id)) {
                const x = this.server_extra_data[data.id];
                this.showView(data, x.intro, x.website);
            } else {
                this.loadingExtra = true;
                this.axios.get(`${this.config.server_api_url}/server/get/${data.id}/extra`).then((res) => {
                    this.server_extra_data[data.id] = res.data.server;
                    this.showView(data, res.data.server.intro, res.data.server.website);
                }).catch((error) => console.error(error));
            }
        },
        showView(data, a, b){
            this.loadingExtra = false;
            this.isModalActive = true;
            this.serverViewData = {
                server: data,
                intro: a,
                website: b
            };
        },
        loadServers(){
            if(this.lock) return;
            this.lock = true;
            this.axios.get(`${this.config.server_api_url}/server/get?params=id,name,ip,port,tags,createdDate,website&from=${this.from_index}`).then((res) => {
                if(res.data.code >= 1){
                    this.servers = this.servers.concat(res.data.servers);
                    const offset = res.data.servers.length;
                    const s = [];
                    for(let i = 0; i < offset; i++){
                        const q = this.servers[this.from_index + i];
                        q.query = {
                            players:{
                                online: 0
                            },
                            online: false,
                            icon: 'data:image/png;base64,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'
                        };
                        s.push(q.id);
                    }
                    this.$toast.open({
                        message: 'Đang kiểm tra tình trạng máy chủ...',
                        type: 'is-info',
                        hasIcon: true,
                        queue: false
                    });
                    this.available = res.data.code === 2;
                    this.axios.get(`${this.config.server_api_url}/server/query?servers=`+s.join(",")).then((res) => {
                        for(let i = 0; i < res.data.result.length; i++){
                            const x = res.data.result[i];
                            const ind = x.n + this.from_index;
                            this.$set(this.servers, ind, Object.assign(this.servers[ind], {
                                query: Object.assign(this.servers[ind].query, x)
                            }));
                        }
                        this.$toast.open({
                            message: "Đã cập nhật tình trạng máy chủ!",
                            type: 'is-success',
                            hasIcon: true,
                            queue: false
                        });

                        this.from_index += offset;
                        this.lock = false;
                    });
                }
                this.isLoading = false;
            }).catch((error) => console.error(error));
        }
    }, 
    head: {
        title: function () {
            return {
                inner: "MCVNServerList", 
                complement: "Trang chủ"
            }
        }, 
        link: [
            { rel: 'stylesheet', href: 'https://cdn.materialdesignicons.com/3.8.95/css/materialdesignicons.min.css' }
        ]
    }
}
</script>
