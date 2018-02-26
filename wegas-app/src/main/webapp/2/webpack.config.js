const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';

const plugins = [
  new CopyWebpackPlugin([
    {
      from: 'node_modules/monaco-editor/min/vs',
      to: 'vs',
    },
  ]),
  new ForkTsCheckerWebpackPlugin(),
];
module.exports = {
  devtool: PROD ? 'source-map' : 'inline-source-map',
  entry: {
    editor: ['./src/Editor/index.tsx'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: 'dist/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    mainFields: ['browser', 'module', 'jsnext:main', 'main'],
  },
  plugins: plugins,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: { transpileOnly: true },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
    ],
  },
  devServer: {
    port: 3000,
    overlay: true,
    publicPath: '/Wegas/2/dist/',
    proxy: {
      '/Wegas': {
        target: 'http://localhost:8080',
      },
    },
  },
};
