/*global require*/
var gulp = require('gulp'),
    emberTemplates = require('gulp-ember-templates'),
    rename = require("gulp-rename"),
    rjs = require("gulp-requirejs"),
    terser = require("gulp-terser"),
    sourcemaps = require("gulp-sourcemaps");
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
    return gulp.src('**/*.hbs', {cwd: "js/templates"})
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
        .pipe(gulp.dest("js/templates"));
});
gulp.task("watch", function() {
    "use strict";
    return gulp.watch("./**/*.hbs", ["compile-template"]);
});


