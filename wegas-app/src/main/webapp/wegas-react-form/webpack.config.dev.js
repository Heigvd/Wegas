const path = require('path');
const webpack = require('webpack');
const cssnext = require('postcss-cssnext');

module.exports = {
    devtool: 'cheap-module-eval-source-map',
    entry: ['babel-polyfill', './src/index.js'],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    resolve: {
        root: [path.resolve('./src')],
        mainFields: ['module', 'jsnext:main', 'browser', 'main']
    },
    plugins: [
        //   new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel',
                // include: [
                //     path.join(__dirname, 'src')
                // ]
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                loader: 'style!css?modules&importLoaders=1!postcss'
            }
        ]
    },
    postcss: () => [cssnext],
    devServer: {
        reload: false,
        inline: true
    }
};
