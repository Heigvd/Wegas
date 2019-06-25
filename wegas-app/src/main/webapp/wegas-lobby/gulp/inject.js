var gulp = require('gulp');

var paths = gulp.paths;

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;
gulp.task('partials', function() {
    'use strict';
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
gulp.task('inject', ['styles', 'partials'], function() {
    'use strict';
    var partialsInjectFile = gulp.src(paths.tmp + '/partials/templateCacheHtml.js', {read: false});
    var partialsInjectOptions = {
        starttag: '<!-- inject:partials -->',
        ignorePath: paths.tmp + '/partials',
        addRootSlash: false
    };
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

    return gulp.src(paths.src + '/*.htm')
        .pipe($.inject(injectStyles, injectOptions))
        .pipe($.inject(injectScripts, injectOptions))
        .pipe($.inject(partialsInjectFile, partialsInjectOptions))
        .pipe(wiredep(wiredepOptions))
        .pipe(gulp.dest(paths.tmp + '/serve'));

});
