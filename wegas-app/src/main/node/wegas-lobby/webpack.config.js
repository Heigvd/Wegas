const path = require('path');

module.exports = {
    entry: './src/components/App.tsx',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {rootMode: "upward"},
            }, {
                test: /\.svg$/,
                use: ['@svgr/webpack']
            },
            {
                test: /\.css$/,
                use: [ 'style-loader','css-loader' ]
            },
               {
          test: /\.woff(2)?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 10000,
                name: './font/[hash].[ext]',
                mimetype: 'application/font-woff'
              }
            }
          ]
        }

        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, '../../../../target/Wegas/wegas-lobby'),
        publicPath: './wegas-lobby/'
    },
    devServer: {
        stats: 'errors-warnings',
        port: 3003,
        overlay: true,
        publicPath: '/Wegas/wegas-lobby',
        proxy: {
            '/Wegas': 'http://localhost:8080',
        }
    }
};
