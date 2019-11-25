module.exports = {
  publicPath: './',
  devServer: {
    proxy: {
      '/*': {
        ws: false,
        target: ' http://192.168.124.9:8080',
        pathRewrite: { '^/': '' },
        secure: false,
        changeOrigin: true
      }
    }
  }
}