const path = require('path');

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
    devtool: PROD ? 'source-map' : 'inline-source-map',
    entry: {
        app: ['./src/index.js'],
    },
    output: {
        path: path.join(__dirname, '../../../../target/Wegas/wegas-stats/build'),
        filename: '[name].bundle-min.js',
        // chunkFilename: '[name].js',
        // publicPath: 'wegas-react-form/dist/',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'],
                include: [path.join(__dirname, 'src')],
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: false,
                            importLoaders: 0,
                        },
                    },
                ],
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        },
                    },
                    'less-loader',
                ],
            },
        ],
    },
    devServer: {
        reload: false,
        inline: true,
    },
};
