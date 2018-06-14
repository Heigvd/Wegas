/*global require*/

var gulp = require('gulp'),
    chug = require('gulp-chug'),
    uglify = require("gulp-uglify"),
    minifycss = require('gulp-csso'),
    sourcemaps = require("gulp-sourcemaps"),
    rename = require("gulp-rename"),
    cache = require("gulp-cache"),
    newer = require("gulp-newer"),
    replace = require("gulp-replace"),
    autoprefixer = require("gulp-autoprefixer"),
    rootPath = "/",
    BROWSERLIST = ['last 2 versions', '> 1%', 'Firefox ESR', 'Firefox >= 18'];

gulp.task('default', ["submodule", "compress-css", "compress-js"], function () {
    "use strict";
    /*@Hack combo support ...*/
    gulp.src("target/Wegas/**/*-min.js")
        .pipe(replace(/sourceMappingURL=([\.\/]*)map/g, "sourceMappingURL=" + rootPath + "map"))
        .pipe(gulp.dest("target/Wegas"));
});
gulp.task("dev", ["setup-dev", "default"]);
gulp.task("setup-dev", function (cb) {
    "use strict";
    rootPath = "/Wegas/";
    cb();
});
gulp.task("submodule", [], function () {
    "use strict";
    return gulp.src([
        'target/Wegas/*/gulpfile.js'
    ], {
            read: false
        })
        .pipe(chug());
});
gulp.task("compress-css", ["submodule"], function () {
    "use strict";
    return gulp.src(["target/Wegas/**/*.css",
        "!target/Wegas/lib/**",
        "!**/node_modules/**",
        "!target/Wegas/wegas-lobby/**",
        "!target/Wegas/wegas-react-form/**",
        "!target/Wegas/2/**",
        "!target/Wegas/wegas-stats/**/*.css",
        "!**/*-min.css"],
        {
            base: "target/Wegas"
        })
        .pipe(newer({
            map: function (path) {
                return "target/Wegas" + path.split(".css")[0] + "-min.css";
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer({
            browsers: BROWSERLIST
        }))
        //         .pipe(cache(minifycss()))
        .pipe(minifycss())
        .pipe(rename({
            suffix: "-min"
        }))
        .pipe(sourcemaps.write("map"))

        .pipe(gulp.dest("target/Wegas"));
});
gulp.task("compress-js", ["submodule"], function () {
    "use strict";
    return gulp.src(["target/Wegas/**/*.js",
        "!target/Wegas/lib/**",
        "!**/*-min.js",
        "!**/gulpfile.js",
        "!**/node_modules/**",
        "!target/Wegas/wegas-lobby/**",
        "!target/Wegas/wegas-react-form/**",
        "!target/Wegas/wegas-stats/**",
        "!target/Wegas/2/**",
        "!target/Wegas/scripts/*.js"],
        {
            base: "target/Wegas"
        })
        .pipe(newer({
            map: function (rp) {
                return "target/Wegas/" + rp.split(".js")[0] + "-min.js";
            }
        }))
        .pipe(sourcemaps.init())
        // .pipe(cache(uglify()))
        .pipe(uglify().on('error', function (e) {
            console.log(e.message);
            throw e;
        }))
        .pipe(rename({
            suffix: "-min"
        }))
        .pipe(sourcemaps.write("map",
            {
                includeContent: false,
                sourceRoot: rootPath
            }))

        .pipe(gulp.dest("target/Wegas"));
});
gulp.task('yarn install', function () {
    return gulp.src('target/Wegas/*/package.json').pipe(require("gulp-install")({
        commands: {
            'package.json': 'yarn'
        },
        yarn: ['--frozen-lockfile', '--production=false']
    }))
})
gulp.task('clear', function (done) {
    "use strict";
    return cache.clearAll(done);
});
