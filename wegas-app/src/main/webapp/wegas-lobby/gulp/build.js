'use strict';

var gulp = require('gulp');
var paths = gulp.paths;
var merge = require('merge-stream');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('partials', function () {
  return gulp.src([
    paths.src + '/{app,components}/**/*.html',
    paths.tmp + '/{app,components}/**/*.html'
  ])
    // .pipe($.minifyHtml({
    //   empty: true,
    //   spare: true,
    //   quotes: true
    // }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'Wegas'
    }))
    .pipe(gulp.dest(paths.tmp + '/partials/'));
});

gulp.task('html', ['inject', 'partials'], function () {
  var partialsInjectFile = gulp.src(paths.tmp + '/partials/templateCacheHtml.js', { read: false });
  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    ignorePath: paths.tmp + '/partials',
    addRootSlash: false
  };

  var htmlFilter = $.filter('*.html');
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');
  var assets;

  var gulped = gulp.src(paths.tmp + '/serve/*.jsp')
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe(assets = $.useref.assets())
    // .pipe($.rev())
    .pipe(jsFilter)
    .pipe($.ngAnnotate());
    gulped = gulped.pipe($.cache($.uglify({preserveComments: $.uglifySaveLicense})));
    gulped = gulped.pipe(jsFilter.restore())
    .pipe(cssFilter);

    gulped = gulped.pipe($.cache($.csso()));

    gulped = gulped.pipe(cssFilter.restore())
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
    .pipe($.size({ title: paths.dist + '/', showFiles: true }));
});

gulp.task('images', function () {
  return gulp.src(paths.src + '/assets/images/**/*')
    .pipe(gulp.dest(paths.dist + '/assets/images/'));
});

gulp.task('fonts', function () {
    var bowerFonts = gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest(paths.dist + '/fonts/'));

  var wegasFonts = gulp.src(paths.src + '/assets/fonts/**/*')
    .pipe(gulp.dest(paths.dist + '/assets/fonts/'));

  return merge(bowerFonts, wegasFonts);
});

gulp.task('misc', function () {
  return gulp.src(paths.src + '/**/*.ico')
    .pipe(gulp.dest(paths.dist + '/'));
});

gulp.task('clean', function (done) {
  $.del([paths.dist + '/', paths.tmp + '/'], done);
});

gulp.task('build', ['html','images', 'fonts', 'misc'], function(cb){
    $.del([paths.tmp], cb);
});
