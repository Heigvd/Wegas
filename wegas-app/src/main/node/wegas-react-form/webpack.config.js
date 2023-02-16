const path = require('path');
// const pkg = require('./package.json');

// const packages = Object.keys(pkg.dependencies);
// [
// 'classnames',
// 'core-js',
// 'jsoninput',
// 'lodash',
// 'material-ui',
// 'react',
// 'react-dom',
// 'react-tinymce',
// 'recast'
// ];


const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
    devtool: PROD ? 'source-map' : 'inline-source-map',
    entry: {
        bundle: './src/index.ts',
    },
    output: {
        path: path.join(__dirname, '../../../../target/Wegas/wegas-react-form/dist'),
        // filename: '[name].js',
        // chunkFilename: '[name].js',
        publicPath: './wegas-react-form/dist/',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        mainFields: ['module', 'jsnext:main', 'browser', 'main'],
    },
    plugins: [
        new NodePolyfillWebpackPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: [path.resolve(__dirname, 'src')],
                use: [
                    'babel-loader',
                    {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: { noEmit: false },
                        },
                    },
                ],
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: [path.join(__dirname, 'src')],
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                        },
                    },
                    'postcss-loader',
                ],
            },
            {
                test: /\.gif$/,
                loader: 'url-loader',
                options: {
                    mimetype: 'image/png',
                },
            },
            {
                test: /\.woff(\?v=[0-9].[0.9].[0.9])?$/,
                loader: 'url-loader',
                options: {
                    mimetype: 'application/font-woff',
                },
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9].[0.9].[0.9])?$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                },
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre',
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
        publicPath: '/Wegas/wegas-react-form/dist',
      },
  },
};
