/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

// eslint-disable-next-line
const gulp = require('gulp');
const webpack = require('webpack');
const config = require('./webpack.config');

gulp.task('default', ['webpack']);
gulp.task('webpack', (callback) => {
    webpack({ ...config, mode: 'production' }, (err, stats) => {
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
