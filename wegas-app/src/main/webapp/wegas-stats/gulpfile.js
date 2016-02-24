/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/*global require*/
var gulp = require('gulp');
var webpack = require('webpack');
var install = require('gulp-install');
var config = require('./webpack.config.prod');
gulp.task("default", ["webpack"], function() {
    "use strict";
});
gulp.task("install", function() {
    "use strict";
    return gulp.src('package.json')
        .pipe(install());
})
gulp.task("webpack", ["install"], function(callback) {
    "use strict";
    webpack(config, function(err, stats) {
        console.log("[webpack]", stats.toString({color: true}));
        callback();
    });
});


