const path = require('path');

module.exports = {
  entry: './src/components/App.tsx',
  devtool: 'inline-source-map',
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
  watchOptions: {
    ignored: /node_modules/,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.woff(2)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: './font/[hash].[ext]',
              mimetype: 'application/font-woff',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, '../../../../target/Wegas/wegas-lobby'),
    publicPath: './wegas-lobby/',
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
      publicPath: '/Wegas/wegas-lobby',
    },
  },
};
