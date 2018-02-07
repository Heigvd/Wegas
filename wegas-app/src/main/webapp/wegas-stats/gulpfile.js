/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/*global require*/
var gulp = require('gulp');
gulp.task("default", ["webpack"], function() {
    "use strict";
});
gulp.task("webpack", function(callback) {
    "use strict";
    var webpack = require('webpack');
    var config = require('./webpack.config.prod');
    webpack(config, function(err, stats) {
      //  console.log("[webpack]", stats.toString({color: true}));
        callback();
    });
});


