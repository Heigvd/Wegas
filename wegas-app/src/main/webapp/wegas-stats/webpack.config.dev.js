const webpack = require('webpack');
const BASE = require('./webpack.config');
const path = require('path');
module.exports = Object.assign({}, BASE, {
    devtool: 'cheap-module-eval-source-map',
    entry: {
        app: ['./src/index.js'],
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'vendor.bundle.js',
            minChunks: function minChunks(module) {
                const context = module.context;
                return context && context.indexOf('node_modules') > -1;
            },
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development'),
            },
        }),
    ],
    devServer: {
        contentBase: path.join(__dirname, '.'),
        port: 3000,
        inline: true,
        proxy: {
            '/Wegas': {
                target: 'http://localhost:8080',
            },
        },
    },
});
