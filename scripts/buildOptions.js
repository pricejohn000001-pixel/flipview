const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const getClientEnvironment = require('./env');

const appPath = fs.realpathSync(process.cwd());
const srcPath = path.resolve(appPath, 'src');
const distPath = path.resolve(appPath, 'public');
const entryPath = path.resolve(appPath, 'src/core');

const getDevOptions = argv => (argv.mode !== 'production') ? ({
  devtool: 'eval-source-map',
  devServer: {
    contentBase: distPath,
    historyApiFallback: true,
    port: 8000,
  },
}) : {};

const getBaseOptions = () => ({
  mode: 'development',
  entry: entryPath,
  output: {
    filename: 'bundle.js',
    path: distPath,
    publicPath: '/',
  },
  devServer: {
      historyApiFallback: true
  },
  resolve: {
    modules: [srcPath, 'node_modules'],
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
    },
  },
  module: {
    rules: [{
      test: /\.jsx?$/i,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime'],
        },
      }],
    }, {
      test: /\.module\.css$/i,
      use: [{
        loader: 'style-loader',
        options: {
          esModule: true,
        },
      }, {
        loader: 'css-loader',
        options: {
          modules: { localIdentName: '[name]__[local]___[hash:base64:5]' },
        },
      }],
    }, {
      test: /\.css$/i,
      exclude: /\.module\.css$/i,
      use: ['style-loader', 'css-loader'],
    }, {
      test: /\.ttf$/i,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      }],
    }, {
      test: /\.(pdf|png|jpg|mp4|mkv|mov|woff|svg|jpeg|xlsx|mp3)$/,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: 'media/[name].[hash:8].[ext]',
          },
        },
      ],
    }, {
      test: /\.wasm$/,
      type: 'asset/resource',
    }],
  }, 
  plugins: [
    new HtmlWebpackPlugin({ inject: true, template: 'src/core/index.html', favicon: 'src/assets/logo/favicon.ico' }),
    new webpack.DefinePlugin(getClientEnvironment()),
  ],
});

module.exports = {
  getBaseOptions,
  getDevOptions,
};
