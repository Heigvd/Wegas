/*global require*/

const gulp = require("gulp"),
  //chug = require('gulp-chug'),
  //babel = require("gulp-babel"),
  uglify = require("gulp-uglify"),
  minifycss = require("gulp-csso"),
  sourcemaps = require("gulp-sourcemaps"),
  rename = require("gulp-rename"),
  cache = require("gulp-cache"),
  newer = require("gulp-newer"),
  replace = require("gulp-replace"),
  autoprefixer = require("gulp-autoprefixer"),
  rootPath = "/",
  log = require("fancy-log"),
  debug = require("gulp-debug");

function compress_css(done) {
  gulp
    .src(
      [
        "target/Wegas/**/*.css",
        "!target/Wegas/lib/**",
        "!**/node_modules/**",
        "!target/Wegas/wegas-lobby/**",
        "!target/Wegas/wegas-react/**",
        "!target/Wegas/wegas-react-form/**",
        "!target/Wegas/2/**",
        "!target/Wegas/wegas-stats/**/*.css",
        "!target/**/dist/**",
        "!**/*-min.css",
      ],
      {
        base: "target/Wegas",
      }
    )
    .on("end", function () {
      log("CSS : Searching modified files");
    })
    .pipe(
      newer({
        map: function (path) {
          return "target/Wegas" + path.split(".css")[0] + "-min.css";
        },
      })
    )
    .on("end", function () {
      log("CSS : Making snapshot for sourcemaps");
    })
    .pipe(sourcemaps.init())
    .on("end", function () {
      log("CSS : Starting autoprefixer");
    })
    .pipe(autoprefixer())
    .on("end", function () {
      log("CSS : Minifying");
    })
    .pipe(minifycss())
    .on("end", function () {
      log("CSS : Suffing minified files");
    })
    .pipe(
      rename({
        suffix: "-min",
      })
    )
    .on("end", function () {
      log("CSS : Writing sourcemaps");
    })
    .pipe(sourcemaps.write("map"))
    .on("end", function () {
      log("CSS : Writing minified files");
    })
    .pipe(gulp.dest("target/Wegas"))
    .on("end", function () {
      log("CSS : Task done");
      done();
    });
}

function compress_js(done) {
  gulp
    .src(
      [
        "target/Wegas/**/*.js",
        "!target/Wegas/lib/**",
        "!**/*-min.js",
        "!**/gulpfile.js",
        "!**/node_modules/**",
        "!target/**/dist/**",
        "!target/Wegas/wegas-lobby/**",
        "!target/Wegas/wegas-react/**",
        "!target/Wegas/wegas-react-form/**",
        "!target/Wegas/wegas-stats/**",
        "!target/Wegas/2/**",
        "!target/Wegas/scripts/*.js",
      ],
      {
        base: "target/Wegas",
      }
    )
    .on("end", function () {
      log("JS : Searching modified files");
    })
    .pipe(
      newer({
        map: function (rp) {
          return "target/Wegas/" + rp.split(".js")[0] + "-min.js";
        },
      })
    )
    .on("end", function () {
      log("JS : Making snapshot for sourcemaps");
    })
    .pipe(sourcemaps.init())
    /*.pipe(babel({
      presets: ['@babel/env'],
      plugins: ['@babel/transform-runtime']
    }))*/
    .on("end", function () {
      log("JS : Minifying");
    })
    .pipe(
      uglify().on("error", function (e) {
        log(e.message);
        done(e);
        //throw e;
      })
    )
    .on("end", function () {
      log("JS : Suffing minified files");
    })
    .pipe(
      rename({
        suffix: "-min",
      })
    )
    .on("end", function () {
      log("JS : Writing sourcemaps");
    })
    .pipe(
      sourcemaps.write("map", {
        includeContent: false,
        sourceRoot: rootPath,
      })
    )
    .on("end", function () {
      log("JS : Writing minified files");
    })
    .pipe(gulp.dest("target/Wegas"))
    .on("end", function () {
      log("JS : Task done");
      done();
    });
}

function hackNames(done) {
  gulp
    .src("target/Wegas/**/*-min.js")
    .on("end", function () {
      log("MIN-JS : Searching min.js files");
    })
    .pipe(
      replace(
        /sourceMappingURL=([\.\/]*)map/g,
        "sourceMappingURL=" + rootPath + "map"
      )
    )
    .on("end", function () {
      log("MIN-JS : Replacing map paths to " + rootPath + "map");
    })
    .pipe(gulp.dest("target/Wegas"))
    .on("end", function () {
      log("MIN-JS : Task done");
      done();
    });
}

function clear(done) {
  cache.clearAll(done);
  done();
}

exports.clear = clear;
exports.compress_js = compress_js;
exports.compress_css = compress_css;
exports.default = gulp.parallel(
  gulp.series(compress_js, hackNames),
  compress_css
);
