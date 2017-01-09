const path = require('path');
const webpack = require('webpack');

const packages = [
    'classnames',
    // 'core-js',
    // 'jsoninput',
    // 'lodash',
    // 'material-ui',
    'react',
    'react-dom',
    // 'react-tinymce',
    // 'recast',
];


module.exports = {
    devtool: 'source-map',
    entry: {
        bundle: './src/index.js',
     //   vendor: packages
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    },
    resolve: {
        mainFields: ['module', 'jsnext:main', 'browser', 'main']
    },
    plugins: [
        // new webpack.optimize.CommonsChunkPlugin({
        //     names: ['vendor', 'manifest']
        // }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            },
            sourceMap: true,
            comments: false
        })
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
    }
};
