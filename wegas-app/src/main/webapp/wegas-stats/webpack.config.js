const path = require('path');
const npmPackage = /node_modules/;
const buildPath = path.resolve(__dirname, 'build');
module.exports = {
    entry: {
        app: [
            './src/index.js'
        ],
        vendor: [
            'react', 'react-dom', 'react-router', 'history',
            'axios', 'redux', 'react-redux',
            'updeep', 'chartist', 'tcomb-form', 'style-loader'
        ]
    },
    output: {
        path: buildPath,
        filename: '[name].bundle-min.js',
        publicPath: '/dev/'
    },
    externals: {
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: 'style!css?-singleton'
            }, {
                test: /\.less$/,
                loader: 'style!css!less'
            }, {
                test: /\.js$/,
                loaders: [
                    'react-hot', 'babel-loader'
                ],
                exclude: [npmPackage]
            }, {
                test: /\.json$/,
                loader: 'json'
            }, {
                test: /\.(woff2|woff|eot|ttf)/,
                loader: 'file'
            }, {
                test: /\.(jpe?g|gif|png|svg)/,
                loader: 'file'
            }
        ]
    }
};
