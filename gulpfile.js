var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  sass = require('gulp-sass'),
  concat = require('gulp-concat'),
  sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function () {
  return gulp.src([
      'bower_components/nvd3/build/nv.d3.css',
      'bower_components/reveal.js/css/reveal.scss',
      //'bower_components/reveal.js/css/theme/black.css',
      'sass/**/*.scss'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('oredev-kodapor.css'))
    .pipe(sass())
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('public'));
});

gulp.task('concat', function () {
  return gulp.src([
      'bower_components/d3/d3.js',
      'bower_components/nvd3/build/nv.d3.js',
      'bower_components/reveal.js/js/reveal.js',
      'src/**/*.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('oredev-kodapor.js'))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('public'));
});

gulp.task('jshint', function () {
  return gulp.src(['gulpfile.js', 'src/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build', ['concat', 'sass']);

gulp.task('watch', function () {
  gulp.watch('sass/**/*.scss', ['sass']);
  gulp.watch(['gulpfile.js', 'src/**/*.js'], ['jshint']);
  gulp.watch('src/**/*.js', ['concat']);
});

gulp.task('default', ['jshint', 'build', 'watch']);