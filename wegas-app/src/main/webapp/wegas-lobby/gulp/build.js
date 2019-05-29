'use strict';

var gulp = require('gulp');
var print = require('gulp-print').default;
var paths = gulp.paths;
var merge = require('merge-stream');

var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('html', ['inject'], function(cb) {

    var htmlFilter = $.filter('*.html');
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    var gulped = gulp.src(paths.tmp + '/serve/*.jsp')
        .pipe($.useref());
    // .pipe($.rev())
    /* JS COMPRESS */
    gulped = gulped.pipe(jsFilter)
        .pipe($.ngAnnotate())
        .pipe($.cache($.uglify({
            preserveComments: $.uglifySaveLicense
        }).on('error', function(error) {
            console.log("Error: " + error);
            cb(error);
        })))
        .pipe(jsFilter.restore());
    /* CSS COMPRESS */
    gulped = gulped
        .pipe(cssFilter)
        .pipe($.cache($.csso())).pipe(cssFilter.restore());

    gulped = gulped
        .pipe($.useref())
        //    .pipe($.revReplace())
        .pipe(htmlFilter);

    gulped = gulped.pipe($.minifyHtml({
        empty: true,
        spare: true,
        quotes: true
    }));

    return gulped.pipe(htmlFilter.restore())
        .pipe(gulp.dest(paths.dist + '/'))
        .pipe($.size({
            title: paths.dist + '/',
            showFiles: true
        }));
});
// no compression on js/css
// should also avoid concatenation ...
gulp.task('debug-build', ['inject'], function(cb) {
    gulp.src('../../../src/main/webapp/wegas-lobby/**/*.js')
        .pipe($.cache($.uglify().on("error", function(error) {
            console.log("Error: " + error);
        }))).pipe(print());


    return gulp.src(paths.tmp + '/serve/*.jsp')
        .pipe($.useref())
        .pipe(gulp.dest(paths.dist + '/'))
        .pipe($.size({
            title: paths.dist + '/',
            showFiles: true
        }));
});
gulp.task('images', function() {
    return gulp.src(paths.src + '/assets/images/**/*')
        .pipe(gulp.dest(paths.dist + '/assets/images/'));
});

gulp.task('fonts', function() {
    var bowerFonts = gulp.src($.mainBowerFiles())
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest(paths.dist + '/fonts/'));

    var wegasFonts = gulp.src(paths.src + '/assets/fonts/**/*')
        .pipe(gulp.dest(paths.dist + '/assets/fonts/'));

    return merge(bowerFonts, wegasFonts);
});

gulp.task('misc', function() {
    return gulp.src(paths.src + '/**/*.ico')
        .pipe(gulp.dest(paths.dist + '/'));
});

gulp.task('clean', function(done) {
    $.del([paths.tmp + '/', paths.dist + '/'], done);
});

gulp.task('build', ['html', 'images', 'fonts', 'misc'], function(cb) {
    $.del([paths.tmp], cb);
});
