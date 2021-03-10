const nodeExternals = require('webpack-node-externals')
const CompressionPlugin = require('compression-webpack-plugin')

const serverConfig = {
  entry: ['@babel/polyfill', './src/index.js'],
  output: {
    filename: './index.js',
    libraryTarget: 'commonjs2'
  },
  mode: 'development',
  devtool: 'inline-cheap-module-source-map',
  target: 'node',
  externals: [
    nodeExternals()
  ],
  resolve: {
    symlinks: false,
    extensions: ['.js', '.json']
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['@babel/preset-env'],
        plugins: ['transform-class-properties']
      }
    }]
  },
  plugins: [new CompressionPlugin()]
}

const clientConfig = {
  entry: ['@babel/polyfill', './src/index.js'],
  output: {
    filename: './d-lib.js',
    libraryTarget: 'var',
    library: 'DProtocol'
  },
  mode: 'production',
  devtool: false,
  target: 'web',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['@babel/preset-env'],
        plugins: ['transform-class-properties']
      }
    }]
  },
  plugins: [new CompressionPlugin()]
}

module.exports = [serverConfig, clientConfig]
