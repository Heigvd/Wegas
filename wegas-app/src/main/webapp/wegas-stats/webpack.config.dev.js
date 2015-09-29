
const webpack = require('webpack');
const BASE = require('./webpack.config');
const path = require('path');
module.exports = Object.assign({}, BASE, {
    devtool: 'cheap-module-eval-source-map',
    entry: {
        app: ['webpack/hot/only-dev-server', './src/index.js'],
        vendor: BASE.entry.vendor
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development')
            }
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, '.'),
        progress: true,
        port: 3000,
        colors: true,
        inline: true,
        proxy: [
            {
                path: /\/rest\/(.*)/,
                target: 'http://localhost:8080/'
            }
        ]
    }
});
