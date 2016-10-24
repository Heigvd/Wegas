const path = require('path');
const webpack = require('webpack');
const cssnext = require('postcss-cssnext');

module.exports = {
    devtool: 'inline-source-map',
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
         rules: [{
            test: /\.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/
            // include: [
            //     path.join(__dirname, 'src')
            // ]
        }, {
            test: /\.css$/,
            use: [
                'style',
                {
                    loader: 'css',
                    options: {
                        modules: true,
                        importLoaders: 1
                    }
                },
                {
                    loader: 'postcss',
                    options: {
                        plugins: () => [cssnext]
                    }

                }
            ]
        }]
    },
    devServer: {
        reload: false,
        inline: true
    }
};
