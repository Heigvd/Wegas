/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/*global require*/
const gulp = require('gulp');
gulp.task('default', ['webpack'], function() {
    'use strict';
});
gulp.task('webpack', function(callback) {
    'use strict';
    const webpack = require('webpack');
    const config = require('./webpack.config.prod');
    webpack(config, function(err, stats) {
        if (err) throw err;
        if (stats.hasErrors()) {
            throw new Error(stats.toString({ color: true }));
        }
        console.log('[webpack]', stats.toString({ color: true }));
        callback();
    });
});
