var gulp = require('gulp');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var mkdirp = require('mkdirp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('styles', function() {
    mkdirp('public/assets/css/');

    gulp.src('resources/assets/local/sass/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest('public/assets/css/'));
});

gulp.task('scripts', function() {
    mkdirp('public/assets/js/');
    gulp.src([
        // Component handler
        'resources/assets/vendor/material-design-lite/src/mdlComponentHandler.js',
        // Polyfills/dependencies
        'resources/assets/vendor/material-design-lite/src/third_party/**/*.js',
        // Base components
        'resources/assets/vendor/material-design-lite/src/button/button.js',
        //'resources/assets/vendor/material-design-lite/src/checkbox/checkbox.js',
        //'resources/assets/vendor/material-design-lite/src/icon-toggle/icon-toggle.js',
        //'resources/assets/vendor/material-design-lite/src/menu/menu.js',
        //'resources/assets/vendor/material-design-lite/src/progress/progress.js',
        //'resources/assets/vendor/material-design-lite/src/radio/radio.js',
        //'resources/assets/vendor/material-design-lite/src/slider/slider.js',
        //'resources/assets/vendor/material-design-lite/src/snackbar/snackbar.js',
        //'resources/assets/vendor/material-design-lite/src/spinner/spinner.js',
        //'resources/assets/vendor/material-design-lite/src/switch/switch.js',
        //'resources/assets/vendor/material-design-lite/src/tabs/tabs.js',
        'resources/assets/vendor/material-design-lite/src/textfield/textfield.js',
        //'resources/assets/vendor/material-design-lite/src/tooltip/tooltip.js',
        // Complex components (which reuse base components)
        //'resources/assets/vendor/material-design-lite/src/layout/layout.js',
        //'resources/assets/vendor/material-design-lite/src/data-table/data-table.js',
        // And finally, the ripples
        'resources/assets/vendor/material-design-lite/src/ripple/ripple.js',
        'resources/assets/local/js/cr.js'
    ])
        .pipe(concat('scripts.min.js'))
        .pipe(uglify({
            sourceRoot: '.',
            sourceMapIncludeSources: true
        }))
        .pipe(gulp.dest('public/assets/js/'));
});