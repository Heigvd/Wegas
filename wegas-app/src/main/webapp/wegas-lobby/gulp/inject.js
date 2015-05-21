var gulp = require('gulp');

var paths = gulp.paths;

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;

gulp.task('inject', ['styles'], function() {
    'use strict';
    var injectStyles = gulp.src([
        paths.tmp + '/serve/{app,components}/**/*.css',
        '!' + paths.tmp + '/serve/app/vendor.css'
    ], {read: false});

    var injectScripts = gulp.src([
        paths.src + '/{app,components}/**/*.js',
        '!' + paths.src + '/{app,components}/**/*.spec.js',
        '!' + paths.src + '/{app,components}/**/*.mock.js'
    ]).pipe($.angularFilesort());

    var injectOptions = {
        ignorePath: [paths.src, paths.tmp + '/serve'],
        addRootSlash: false
    };

    var wiredepOptions = {
        directory: 'bower_components',
        exclude: [/bootstrap\.css/, /foundation\.css/]
    };

    return gulp.src(paths.src + '/*.jsp')
        .pipe($.cache($.inject(injectStyles, injectOptions)))
        .pipe($.cache($.inject(injectScripts, injectOptions)))
        .pipe($.cache(wiredep(wiredepOptions)))
        .pipe(gulp.dest(paths.tmp + '/serve'));

});
