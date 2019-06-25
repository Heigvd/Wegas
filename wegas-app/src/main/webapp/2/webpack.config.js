/* eslint-env node */
/* eslint  @typescript-eslint/no-var-requires: "off" */
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin;

const PROD = process.env.NODE_ENV === 'production';
const isCI =
  typeof process.env.CI === 'string'
    ? process.env.CI.toLowerCase() === 'true'
    : false;

const plugins = [
  new MonacoWebpackPlugin({
    languages: ['json', 'css', 'javascript', 'typescript'],
  }),
];
if (!isCI) {
  plugins.push(
    new ForkTsCheckerWebpackPlugin({
      formatter: 'codeframe',
    }),
  );
  // plugins.push(new BundleAnalyzerPlugin());
}
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
                  transpileOnly: !isCI,
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
              transpileOnly: !isCI,
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
