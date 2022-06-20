/* eslint-env node */
/* eslint  @typescript-eslint/no-var-requires: "off" */
const path = require('path');
const webpack = require('webpack');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';
const PREPROD = process.env.NODE_ENV === 'pre-production';
const STATS = process.env.NODE_ENV === 'stats';

const isCI =
  typeof process.env.CI === 'string'
    ? process.env.CI.toLowerCase() === 'true'
    : false;

const plugins = [
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
  }),
  new webpack.ProvidePlugin({
    process: 'process/browser',
  }),
  new ForkTsCheckerWebpackPlugin({
    typescript: { configFile: process.env.TS_NODE_PROJECT },
  }),
  new CopyPlugin({
    patterns: [{ from: 'src/**/*.less' }],
  }),
  new ESLintPlugin({
    context: './src',
    extensions: ['ts', 'tsx'],
    quiet: true,
    failOnError: PROD ? true : false,
  }),
];

if (!isCI && PREPROD) {
  plugins.push(new BundleAnalyzerPlugin());
}

const modules = {
  devtool: PROD || PREPROD ? 'source-map' : 'source-map',
  optimization: {
    minimizer: [
      compiler => {
        const TerserPlugin = require('terser-webpack-plugin');
        new TerserPlugin({
          terserOptions: {
            mangle: {
              keep_classnames: true,
              keep_fnames: true,
            },
            compress: {
              passes: 2,
            },
          },
        }).apply(compiler);
      },
    ],
  },
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
    extensions: [
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
      '.ttf',
      '.d.ts',
    ],
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
      // Specifically made for react-dnd@16
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behavior
        },
      },
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
      {
        test: /\.txt$/i,
        use: 'raw-loader',
      },
      {
        test: /\.less$/i,
        use: 'raw-loader',
      },
      {
        // https://github.com/foxglove/studio/pull/546/commits/8a60775ac428b25c8cf7bd4be7c5075f4b9bafdc
        // TypeScript uses dynamic requires()s when running in node. We can disable these when we
        // bundle it for the renderer.
        test: /[\\/]node_modules[\\/]typescript[\\/]lib[\\/]typescript\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search:
                'var _a = require("perf_hooks"), nodePerformance_1 = _a.performance, PerformanceObserver_1 = _a.PerformanceObserver;',
              replace:
                "throw new Error('[perf_hooks] This module is not supported in the browser.');",
            },
          ],
        },
      },
    ],
  },
  devServer: {
    host: 'localhost',
    port: 3003,
    proxy: {
      '/Wegas': 'http://localhost:8080',
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    devMiddleware: {
      stats: 'errors-warnings',
      publicPath: '/Wegas/wegas-react/dist',
    },
  },
};

module.exports = STATS ? smp.wrap(modules) : modules;
