/* eslint-env node */
/* eslint  @typescript-eslint/no-var-requires: "off" */
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin;

const PROD = process.env.NODE_ENV === 'production';
const STATS = process.env.NODE_ENV === 'stats';
const isCI =
  typeof process.env.CI === 'string'
    ? process.env.CI.toLowerCase() === 'true'
    : false;

const plugins = [
  new MonacoWebpackPlugin({
    languages: ['json', 'css', 'javascript', 'typescript'],
  }),
  new ForkTsCheckerWebpackPlugin({
    formatter: 'codeframe',
  }),
];
if (!isCI) {
  // plugins.push(new BundleAnalyzerPlugin());
}

const modules = {
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
    port: 3003,
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
