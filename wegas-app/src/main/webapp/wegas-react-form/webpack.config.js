const path = require('path');
const webpack = require('webpack');
// const pkg = require('./package.json');

// const packages = Object.keys(pkg.dependencies);
// [
// 'classnames',
// 'core-js',
// 'jsoninput',
// 'lodash',
// 'material-ui',
// 'react',
// 'react-dom',
// 'react-tinymce',
// 'recast'
// ];
const PROD = process.env.NODE_ENV === 'production';
const plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: PROD
                ? JSON.stringify('production')
                : JSON.stringify('development')
        }
    }),
    // new webpack.optimize.ModuleConcatenationPlugin(), // webpack 3
    new webpack.optimize.CommonsChunkPlugin({
        name: 'bundle',
        async: false,
        minChunks: function minChunks(module) {
            const context = module.context;
            return context && context.indexOf('node_modules') > -1;
        }
    })
    // Causes trouble with YUI loader.
    // new webpack.optimize.CommonsChunkPlugin({
    //     name: 'manifest',
    //     minChunks: Infinity
    // })
];
if (PROD) {
    plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            },
            sourceMap: true,
            comments: false
        })
    );
    // Concat plugin doesn't trigger watch mode. (webpack 3 plugin)
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
}
module.exports = {
    devtool: PROD ? 'source-map' : 'inline-source-map',
    entry: {
        bundle: './src/index.ts'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[name].js',
        publicPath: 'wegas-react-form/dist/'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        mainFields: ['module', 'jsnext:main', 'browser', 'main']
    },
    plugins,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'],
                exclude: /node_modules/
                // include: [
                //     path.join(__dirname, 'src')
                // ]
            },
            {
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
            },
            {
                test: /\.gif$/,
                loader: 'url-loader',
                options: {
                    mimetype: 'image/png'
                }
            },
            {
                test: /\.woff(\?v=[0-9].[0.9].[0.9])?$/,
                loader: 'url-loader',
                options: {
                    mimetype: 'application/font-woff'
                }
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9].[0.9].[0.9])?$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            }
        ]
    },
    devServer: {
        reload: false,
        inline: true
    }
};
