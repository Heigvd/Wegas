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

gulp.task('default', ["compress-css", "compress-js"], function () {
    "use strict";
    /*@Hack combo support ...*/
    gulp.src("target/Wegas/**/*-min.js")
        .pipe(replace(/sourceMappingURL=([\.\/]*)map/g, "sourceMappingURL=" + rootPath + "map"))
        .pipe(gulp.dest("target/Wegas"));
});
gulp.task("compress-css", function () {
    "use strict";
    return gulp.src(["target/Wegas/**/*.css",
        "!target/Wegas/lib/**",
        "!**/node_modules/**",
        "!target/Wegas/wegas-lobby-react/**",
        "!target/Wegas/wegas-react/**",
        "!target/Wegas/wegas-react-form/**",
        "!target/Wegas/2/**",
        "!target/Wegas/wegas-stats/**/*.css",
        "!target/**/dist/**",
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
gulp.task("compress-js", function () {
    "use strict";
    return gulp.src(["target/Wegas/**/*.js",
        "!target/Wegas/lib/**",
        "!**/*-min.js",
        "!**/gulpfile.js",
        "!**/node_modules/**",
        "!target/**/dist/**",
        "!target/Wegas/wegas-react/**",
        "!target/Wegas/wegas-lobby-react/**",
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
gulp.task('clear', function (done) {
    "use strict";
    return cache.clearAll(done);
});
