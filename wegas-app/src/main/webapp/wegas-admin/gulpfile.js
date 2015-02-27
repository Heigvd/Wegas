/*global require*/
var gulp           = require('gulp'),
    emberTemplates = require('gulp-ember-templates'),
    rename         = require("gulp-rename"),
    rjs            = require("gulp-requirejs"),
    uglify         = require("gulp-uglify"),
    sourcemaps     = require("gulp-sourcemaps");
gulp.task("default", ["compile-template"], function() {
    "use strict";

    rjs({
        baseUrl: "js",
        name: "loader",
        mainConfigFile: "js/loader.js",
        out: "loader-bundle.js"
    })
        .pipe(gulp.dest("js"));
});

gulp.task("compile-template", function() {
    "use strict";
    return gulp.src('*.hbs', {cwd: "js/templates"})
        .pipe(emberTemplates({
            compiler: require('./js/ember-template-compiler-min'),
            isHTMLBars: true,
            type: "amd",
            moduleName: ""
        }))
        .pipe(rename({extname: ".js"}))
        .pipe(gulp.dest("js/templates"));
});


