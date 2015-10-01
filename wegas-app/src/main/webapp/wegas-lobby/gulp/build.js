'use strict';

var gulp = require('gulp');
var paths = gulp.paths;
var merge = require('merge-stream');

var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('html', ['inject'], function() {

    var htmlFilter = $.filter('*.html');
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');
    var assets;

    var gulped = gulp.src(paths.tmp + '/serve/*.jsp')
        .pipe(assets = $.useref.assets());
    // .pipe($.rev())
    /* JS COMPRESS */
    gulped = gulped.pipe(jsFilter)
        .pipe($.ngAnnotate())
        .pipe($.cache($.uglify({preserveComments: $.uglifySaveLicense})))
        .pipe(jsFilter.restore());
    /* CSS COMPRESS */
    gulped = gulped
        .pipe(cssFilter)
        .pipe($.cache($.csso())).pipe(cssFilter.restore());

    gulped = gulped
        .pipe(assets.restore())
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
gulp.task('debug-build', ['inject'], function() {
    var assets = $.useref.assets();
    return gulp.src(paths.tmp + '/serve/*.jsp')
        .pipe(assets)
        .pipe(assets.restore())
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
