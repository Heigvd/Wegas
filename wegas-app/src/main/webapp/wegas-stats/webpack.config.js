const path = require('path');
const npmPackage = /node_modules/;
const buildPath = path.resolve(__dirname, 'build');
module.exports = {
    entry: {
        app: ['./src/index.js']
    },
    output: {
        path: buildPath,
        filename: '[name].bundle-min.js',
        publicPath: '/dev/',
    },
    externals: {},
    node: { fs: 'empty' },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader?-singleton',
            },
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader',
            },
            {
                test: /\.js$/,
                use: ['babel-loader'],
                exclude: npmPackage,
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
            {
                test: /\.(woff2|woff|eot|ttf)/,
                loader: 'file-loader',
            },
            {
                test: /\.(jpe?g|gif|png|svg)/,
                loader: 'file-loader',
            },
        ],
    },
};
