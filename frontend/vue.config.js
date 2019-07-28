module.exports = {
    publicPath: process.env.NODE_ENV === 'development' ? '/' : './server/',
    runtimeCompiler: true,
    productionSourceMap: false
};
