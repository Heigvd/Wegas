/*global require*/

var gulp = require('gulp'),
    chug = require('gulp-chug'),
    uglify = require("gulp-uglify"),
    minifycss = require('gulp-cssmin'),
    sourcemaps = require("gulp-sourcemaps"),
    rename = require("gulp-rename"),
    cache = require("gulp-cache"),
    replace = require("gulp-replace"),
    rootPath = "/";

gulp.task('default', ["submodule", "compress-css", "compress-js"], function() {
    "use strict";
    /*@Hack combo support ...*/
    gulp.src("target/Wegas/**/*-min.js")
        .pipe(replace(/sourceMappingURL=([\.\/]*)map/g, "sourceMappingURL=" + rootPath + "map"))
        .pipe(gulp.dest("target/Wegas"));
});
gulp.task("dev", ["setup-dev", "default"]);
gulp.task("setup-dev", function(cb) {
    "use strict";
    rootPath = "/Wegas/";
    cb();
});
gulp.task("submodule", function() {
    "use strict";
    return gulp.src([
        'target/Wegas/*/gulpfile.js'
    ], { read: false })
    .pipe(chug());
});
gulp.task("compress-css", ["submodule"], function() {
    "use strict";
    return gulp.src(["target/Wegas/**/*.css",
            "!target/Wegas/lib/**",
            "!target/Wegas/wegas-stats/**/*.css",
            "!**/*-min.css"],
        {base: "target/Wegas"})
        .pipe(sourcemaps.init())
        .pipe(cache(minifycss()))
        .pipe(rename({suffix: "-min"}))
        .pipe(sourcemaps.write("map"))

        .pipe(gulp.dest("target/Wegas"));
});
gulp.task("compress-js", ["submodule"], function() {
    "use strict";
    return gulp.src(["target/Wegas/**/*.js",
            "!target/Wegas/lib/**",
            "!**/*-min.js",
            "!**/gulpfile.js",
            "!target/Wegas/wegas-lobby/**/*.js",
            "!target/Wegas/wegas-stats/**/*.js",
            "!target/Wegas/scripts/*.js"],
        {base: "target/Wegas"})
        .pipe(sourcemaps.init())
        .pipe(cache(uglify()))
        .pipe(rename({suffix: "-min"}))
        .pipe(sourcemaps.write("map",
            {
                includeContent: false,
                sourceRoot: rootPath
            }))

        .pipe(gulp.dest("target/Wegas"));
});
gulp.task('clear', function(done) {
    "use strict";
    return cache.clearAll(done);
});
