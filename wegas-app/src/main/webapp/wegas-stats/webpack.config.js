
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
            'updeep', 'chartist', 'tcomb-form'
        ]
    },
    resolve: {
        root: path.join(__dirname, '/src'),
        modulesDirectories: ['node_modules', 'js', 'css']
    },
    output: {
        path: buildPath,
        filename: '[name].bundle-min.js',
        publicPath: '/static/'
    },
    externals: {
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: 'style!css?-singleton'
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
                test: /\.(woff|eot|ttf)/,
                loader: 'file'
            }, {
                test: /\.(jpe?g|gif|png|svg)/,
                loader: 'file'
            }
        ]
    }
};
