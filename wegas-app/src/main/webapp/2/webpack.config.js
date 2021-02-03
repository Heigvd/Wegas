/* eslint-env node */
/* eslint  @typescript-eslint/no-var-requires: "off" */
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';
const PREPROD = process.env.NODE_ENV === 'pre-production';
const STATS = process.env.NODE_ENV === 'stats';
const isCI =
  typeof process.env.CI === 'string'
    ? process.env.CI.toLowerCase() === 'true'
    : false;

const plugins = [
  // new MonacoWebpackPlugin({
  //   languages: ['json', 'css', 'javascript', 'typescript'],
  // }),
  new ForkTsCheckerWebpackPlugin({
    formatter: 'codeframe',
  }),
  new CopyPlugin({
    patterns: [{ from: 'src/**/*.less' }],
  }),
];
if (!isCI && PREPROD) {
  plugins.push(new BundleAnalyzerPlugin());
}

const modules = {
  // Avoid stupid warnings that occures when webpack cannot manage modules
  node: {
    fs: 'empty',
    module: 'empty',
  },
  // stats: 'verbose',
  devtool: PROD || PREPROD ? 'source-map' : 'inline-source-map',
  entry: {
    editor: ['./src/Editor/index.tsx'],
    player: ['./src/player.tsx'],
    trainer: ['./src/trainer.tsx'],
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
    // https://github.com/ivan-aksamentov/reactlandia-bolerplate-lite/issues/5#issuecomment-413306341
    exprContextCritical: false,
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
    stats: 'errors-warnings',
    port: PREPROD ? 4004 : 3003,
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
