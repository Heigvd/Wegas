'use strict';

var gulp = require('gulp');
var bower = require('gulp-bower');

gulp.paths = {
    src: 'src',
    dist: '..',
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
    gulp.watch(['src/**/*.js', 'src/**/*.scss', 'src/**/*.html'], ['debug-build']);
});

