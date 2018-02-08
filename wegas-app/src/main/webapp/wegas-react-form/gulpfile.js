// eslint-disable-next-line
const gulp = require('gulp');
const webpack = require('webpack');

const config = require('./webpack.config');

gulp.task('default', ['build']);
gulp.task('build', callback => {
    webpack(config, (err, stats) => {
        // Seems we have troubles getting errors back.
        // Fail if an ERROR is found.
        if (err) throw err;
        if (stats.hasErrors()) {
            throw Error(
                stats.toString({
                    color: true,
                })
            );
        }
        // eslint-disable-next-line
        console.log(
            '[webpack]',
            stats.toString({
                color: true,
            })
        );
        callback();
    });
});
