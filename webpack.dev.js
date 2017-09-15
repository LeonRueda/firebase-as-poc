const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HotModuleReplacementPlugin = require('webpack').HotModuleReplacementPlugin;

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist'
  },
  plugins: [
    new HotModuleReplacementPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
});
