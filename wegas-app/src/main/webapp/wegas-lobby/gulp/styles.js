'use strict';

var gulp = require('gulp');

var paths = gulp.paths;

var $ = require('gulp-load-plugins')();
var BROWSERLIST = ['last 2 versions', '> 1%', 'Firefox ESR', 'Firefox >= 18'];

gulp.task('styles', function() {

    var sassOptions = {
        outputStyle: 'expanded'
    };

    var injectFiles = gulp.src([
        paths.src + '/{app,components}/**/*.scss',
        '!' + paths.src + '/app/index.scss',
        '!' + paths.src + '/app/vendor.scss'
    ], {
        read: false
    });

    var injectOptions = {
        transform: function(filePath) {
            filePath = filePath.replace(paths.src + '/app/', '');
            filePath = filePath.replace(paths.src + '/components/', '../components/');
            return '@import \'' + filePath + '\';';
        },
        starttag: '// injector',
        endtag: '// endinjector',
        addRootSlash: false
    };

    var indexFilter = $.filter('index.scss');

    return gulp.src([
        paths.src + '/app/index.scss',
        paths.src + '/assets/sass/index.scss',
        paths.src + '/app/vendor.scss'
    ])
        .pipe(indexFilter)
        .pipe($.inject(injectFiles, injectOptions))
        .pipe(indexFilter.restore())
        .pipe($.sass(sassOptions))
        .pipe($.autoprefixer({
            browsers: BROWSERLIST
        }))
        .on('error', function handleError(err) {
            console.error(err.toString());
            this.emit('end');
        })
        .pipe(gulp.dest(paths.tmp + '/serve/app/'));
});
