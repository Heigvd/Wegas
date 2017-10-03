const webpack = require('webpack');
const BASE = require('./webpack.config');

module.exports = Object.assign({}, BASE, {
    devtool: 'source-map',
    plugins: [
        //   new webpack.NoErrorsPlugin(),
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
                NODE_ENV: JSON.stringify('production'),
            },
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.optimize.UglifyJsPlugin({}),
    ],
});
