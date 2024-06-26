const path = require('path');

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
    devtool: PROD ? 'source-map' : 'inline-source-map',
    entry: {
        app: ['./src/index.tsx'],
    },
    output: {
        path: path.join(__dirname, '../../../../target/Wegas/wegas-stats/build'),
        filename: '[name].bundle-min.js',
        // chunkFilename: '[name].js',
        // publicPath: 'wegas-react-form/dist/',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                include: [path.join(__dirname, 'src')],
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
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
