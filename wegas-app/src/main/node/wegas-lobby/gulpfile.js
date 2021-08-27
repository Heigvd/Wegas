/* global require */
'use strict';

var gulp = require('gulp');
var bower = require('gulp-bower');

gulp.paths = {
    src: 'src',
    dist: '../../../../target/Wegas/wegas-lobby',
    tmp: '.tmp',
    e2e: 'e2e'
};

require('require-dir')('./gulp');

gulp.task('bower', function() {
    return bower()
        .pipe(gulp.dest('bower_components/'));
});

gulp.task('default', ['bower'], function() {
    gulp.start('build');
});

gulp.task('watch', ['debug-build'], function() {
    var t;
    gulp.watch(['src/**/*.js', 'src/**/*.scss', 'src/**/*.html'], {debounceDelay: 5000}).on('change', function() {
        if (!t) {
            t = setTimeout(function() {
                gulp.start('debug-build');
                t = null;
            }, 3000);
        }
    });
});

