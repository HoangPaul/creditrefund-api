var gulp = require('gulp');
var sass = require('gulp-sass');
var rename = require('gulp-rename');

gulp.task('default', function() {
    console.log('Hello world!');
});

gulp.task('compile', function() {
    gulp.src('resources/assets/local/sass/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename('styles.css'))
        .pipe(gulp.dest('public/assets/css/'));
});
