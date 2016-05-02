var gulp = require('gulp');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var mkdirp = require('mkdirp');

gulp.task('default', function() {
    console.log('Hello world!');
});

gulp.task('compile', function() {
    mkdirp('public/assets/css/');

    gulp.src('resources/assets/local/sass/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename('styles.css'))
        .pipe(gulp.dest('public/assets/css/'));
});
