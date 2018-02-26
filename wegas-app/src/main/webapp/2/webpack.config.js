const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';

const plugins = [
    new CopyWebpackPlugin([
        {
            from: 'node_modules/monaco-editor/min/vs',
            to: 'vs',
        },
    ]),
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: PROD
                ? JSON.stringify('production')
                : JSON.stringify('development'),
        },
    }),
    // new webpack.optimize.ModuleConcatenationPlugin(), // webpack 3
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendors',
        minChunks: function minChunks(module) {
            const context = module.context;
            return context && context.indexOf('node_modules') > -1;
        },
    }),
    new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        minChunks: Infinity,
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
];
if (PROD) {
    //UGLIFY
} else {
    plugins.push(new webpack.NamedModulesPlugin());
}
module.exports = {
    devtool: PROD ? 'source-map' : 'inline-source-map',
    entry: {
        editor: ['./src/Editor/index.tsx'],
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[name].js',
        publicPath: 'dist/',
        pathinfo: !PROD,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        mainFields: ['module', 'jsnext:main', 'browser', 'main'],
    },
    plugins: plugins,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre',
            },
        ],
    },
    devServer: {
        port: 3000,
        overlay: true,
        publicPath: '/Wegas/2/dist/',
        proxy: {
            '/Wegas': {
                target: 'http://localhost:8080',
            },
        },
    },
};
