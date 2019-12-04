/* eslint-env node */
/* eslint  @typescript-eslint/no-var-requires: "off" */
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const webpack = require('webpack');

// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

const PROD = process.env.NODE_ENV === 'production';
const STATS = process.env.NODE_ENV === 'stats';
const isCI =
  typeof process.env.CI === 'string'
    ? process.env.CI.toLowerCase() === 'true'
    : false;

const start = new Date().getTime();
let prevTs = start;

const plugins = [
  // new MonacoWebpackPlugin({
  //   languages: ['json', 'css', 'javascript', 'typescript'],
  // }),
  new ForkTsCheckerWebpackPlugin({
    formatter: 'codeframe',
  }),
  new webpack.ProgressPlugin({
    entries: true,
    modules: true,
    modulesCount: 100,
    profile: true,
    handler: (percentage, message, ...args) => {
      const now = new Date().getTime();
      const duration = now - prevTs;
      const totalDuration = now - start;

      console.info((duration/1000), totalDuration / 1000, (percentage*100).toFixed(2) + "% : ", message, ...args);

      prevTs = now;
    },
  }),
];
if (!isCI && !PROD) {
  plugins.push(new BundleAnalyzerPlugin());
}

const modules = {
  // Avoid stupid warnings that occures when webpack cannot manage modules
  node: {
    fs: 'empty',
    module: 'empty',
  },
  // stats: 'verbose',
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
    mainFields: ['browser', 'module', 'main'],
  },
  plugins: plugins,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        oneOf: [
          {
            test: /\.build\.tsx?$/,
            use: [
              { loader: 'val-loader' },
              {
                loader: 'ts-loader',
                options: {
                  compilerOptions: {
                    target: 'es2018',
                    module: 'commonjs',
                    noEmit: false,
                  },
                  transpileOnly: true,
                  instance: 'node',
                  onlyCompileBundledFiles: true,
                },
              },
            ],
          },
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                noEmit: false,
              },
              transpileOnly: true,
              instance: 'web',
              onlyCompileBundledFiles: true,
            },
          },
        ],
      },
      // {
      //   test: /\.tsx?$/,
      //   loader: 'awesome-typescript-loader',
      // },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // {
      //   test: /\.js$/,
      //   use: ['source-map-loader'],
      //   enforce: 'pre',
      // },
      {
        test: /\.(png|jp(e*)g|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8000, // Convert images < 8kb to base64 strings
              name: 'src/pictures/[hash]-[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.txt$/i,
        use: 'raw-loader',
      },
    ],
  },
  devServer: {
    port: PROD ? 4004 : 3003,
    overlay: true,
    publicPath: '/Wegas/2/dist/',
    proxy: {
      '/Wegas': {
        target: 'http://localhost:8080',
      },
    },
  },
};

module.exports = STATS ? smp.wrap(modules) : modules;
