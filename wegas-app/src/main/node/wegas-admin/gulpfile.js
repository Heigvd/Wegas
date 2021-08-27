/*global require*/
var gulp = require('gulp'),
    emberTemplates = require('gulp-ember-templates'),
    rename = require("gulp-rename"),
    rjs = require("gulp-requirejs"),
    uglify = require("gulp-uglify"),
    sourcemaps = require("gulp-sourcemaps");

var targetDir = '../../../../target';
var workdir = targetDir + '/wegas-admin-workdir';

gulp.task("default", ["compile-template"], function() {
    "use strict";

    rjs({
        baseUrl: workdir + "/js",
        name: "loader",
        mainConfigFile: "js/loader.js",
        out: "loader-bundle.js"
    })
        .pipe(gulp.dest(targetDir + "/Wegas/wegas-admin/js"));
});


gulp.task('copy-sources', function() {
    "use strict";
    return gulp.src('js/**')
        .pipe(gulp.dest(workdir+ "/js"));
});


gulp.task("compile-template", ['copy-sources'], function() {
    "use strict";
    return gulp.src('./**/*.hbs', {cwd: workdir + "/js/templates"})
        .pipe(emberTemplates({
            compiler: require('./js/ember-template-compiler-min'),
            isHTMLBars: true,
            type: "amd",
            name: {
                replace: /\\/g,
                with: "/"
            },
            moduleName: ""
        }))
        .pipe(rename({extname: ".js"}))
        .pipe(gulp.dest(workdir + "/js/templates"));
});

