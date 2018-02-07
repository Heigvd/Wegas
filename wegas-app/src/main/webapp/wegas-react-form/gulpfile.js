const gulp = require('gulp');
const webpack = require('webpack');

gulp.task('default', ['build']);
gulp.task('build', callback => {
    const config = require('./webpack.config');
    webpack(config, (err, stats) => {
        console.log('[webpack]', stats.toString({
            color: true
        }));
        callback();
    });
});
