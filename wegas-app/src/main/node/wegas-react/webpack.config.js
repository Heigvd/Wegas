/* eslint-env node */
/* eslint  @typescript-eslint/no-var-requires: "off" */
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
// const WebpackReactComponentNamePlugin = require('webpack-react-component-name');

const PROD = process.env.NODE_ENV === 'production';
const PREPROD = process.env.NODE_ENV === 'pre-production';
const STATS = process.env.NODE_ENV === 'stats';

const isCI =
  typeof process.env.CI === 'string'
    ? process.env.CI.toLowerCase() === 'true'
    : false;

const plugins = [
  // new WebpackReactComponentNamePlugin(),
  new ForkTsCheckerWebpackPlugin({
    formatter: 'codeframe',
    tsconfig: process.env.TS_NODE_PROJECT,
  }),
  new CopyPlugin({
    patterns: [{ from: 'src/**/*.less' }],
  }),
];
if (!isCI && PREPROD) {
  plugins.push(new BundleAnalyzerPlugin());
}

const modules = {
  devtool: PROD || PREPROD ? 'source-map' : 'inline-source-map',
  entry: {
    editor: ['./src/index.tsx'],
    player: ['./src/player.tsx'],
    host: ['./src/host.tsx'],
  },
  output: {
    path: path.join(__dirname, '../../../../target/Wegas/wegas-react/dist/'),
    publicPath: '../wegas-react/dist/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    mainFields: ['browser', 'module', 'main'],
  },
  plugins: plugins,
  module: {
    // https://github.com/ivan-aksamentov/reactlandia-bolerplate-lite/issues/5#issuecomment-413306341
    exprContextCritical: false,
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts)x?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      // {
      //   // Include ts, tsx, js, and jsx files.
      //   test: /\.(ts)x?$/,
      //   exclude: /node_modules/,
      //   loader: 'ts-loader',
      // },
      // {
      //   test: /\.tsx?$/,
      //   exclude: /node_modules/,
      //   oneOf: [
      //     {
      //       test: /\.build\.tsx?$/,
      //       use: [
      //         { loader: 'val-loader' },
      //         {
      //           loader: 'ts-loader',
      //           options: {
      //             compilerOptions: {
      //               target: 'es2018',
      //               module: 'commonjs',
      //               noEmit: false,
      //             },
      //             transpileOnly: true,
      //             instance: 'node',
      //             onlyCompileBundledFiles: true,
      //           },
      //         },
      //       ],
      //     },
      //     {
      //       loader: 'ts-loader',
      //       options: {
      //         compilerOptions: {
      //           noEmit: false,
      //         },
      //         transpileOnly: true,
      //         instance: 'web',
      //         onlyCompileBundledFiles: true,
      //       },
      //     },
      //   ],
      // },
      // {
      //   test: /\.tsx?$/,
      //   loader: 'awesome-typescript-loader',
      // },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jp(e*)g)$/,
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
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(ttf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8000,
              name: 'src/fonts/[hash]-[name].[ext]',
            },
          },
        ],
      },
      // {
      //   test: /\.less$/,
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         name: 'css/[hash]-[name].[ext]',
      //       },
      //     },
      //   ],
      // },

      {
        test: /\.txt$/i,
        use: 'raw-loader',
      },
      {
        test: /\.less$/i,
        use: 'raw-loader',
      },
      // {
      //   test: /\.less$/,
      //   use: [
      //     { loader: 'style-loader' },
      //     { loader: 'css-loader' },
      //     { loader: 'less-loader' },
      //   ],
      // },
    ],
  },
  devServer: {
    host: 'localhost',
    port: PREPROD ? 4004 : 3003,
    proxy: {
      '/Wegas': 'http://localhost:8080',
    },
    client: {
      overlay: true,
    },
    devMiddleware: {
      stats: 'errors-warnings',
      publicPath: '/Wegas/wegas-react/dist',
    },
  },
};

module.exports = STATS ? smp.wrap(modules) : modules;
