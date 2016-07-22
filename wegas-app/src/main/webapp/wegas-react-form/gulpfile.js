const gulp = require('gulp');
const webpack = require('webpack');

gulp.task('default', ['build:dev']);
gulp.task('build:dev', callback => {
    const config = require('./webpack.config.dev');
    webpack(config, (err, stats) => {
        console.log('[webpack]', stats.toString({
            color: true
        }));
        callback();
    });
});
