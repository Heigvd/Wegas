const path = require('path');
const WebpackReactComponentNamePlugin = require('webpack-react-component-name');

module.exports = {
  entry: './src/components/App.tsx',
  devtool: 'inline-source-map',
  plugins: [new WebpackReactComponentNamePlugin()],
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
