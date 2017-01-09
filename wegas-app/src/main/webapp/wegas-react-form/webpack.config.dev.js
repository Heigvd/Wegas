const path = require('path');
const webpack = require('webpack');

module.exports = {
    devtool: 'inline-source-map',
    entry: ['./src/index.js'],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    resolve: {
        mainFields: ['module', 'jsnext:main', 'browser', 'main']
    },
    plugins: [
        //   new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    module: {
        rules: [{
            test: /\.jsx?$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
            // include: [
            //     path.join(__dirname, 'src')
            // ]
        }, {
            test: /\.css$/,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                        importLoaders: 1
                    }
                },
                'postcss-loader'
            ]
        }]
    },
    devServer: {
        reload: false,
        inline: true
    }
};
