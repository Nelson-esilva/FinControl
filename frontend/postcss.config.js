const path = require('path')

module.exports = {
  plugins: {
    tailwindcss: {},
    [path.resolve(__dirname, 'node_modules/autoprefixer')]: {},
  },
}
