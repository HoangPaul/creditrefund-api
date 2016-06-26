var fs = require('fs');

var gulp = require('gulp');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var mkdirp = require('mkdirp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gulpSequence = require('gulp-sequence');
var handlebars = require('gulp-compile-handlebars');
var rev = require('gulp-rev');

gulp.task('default', ['templates']);

gulp.task('compile', ['default']);

gulp.task('templates', ['_prepareResourcesForTemplates'], function() {
    var inlineStyles = fs.readFileSync('resources/tmp/inlineStyles.min.css', {'encoding': 'utf8'});
    var loadCss = fs.readFileSync('resources/tmp/loadCss.min.js', {'encoding': 'utf8'});
    var revManifest = JSON.parse(fs.readFileSync('resources/tmp/rev-manifest.json', {'encoding': 'utf8'}));

    return gulp.src('resources/templates/*.hbs')
        .pipe(handlebars({
            'styles': revManifest['styles.min.css'],
            'scripts': revManifest['scripts.min.js'],
            'inlineStyles': inlineStyles,
            'loadCss': loadCss,
            'baseUrl': 'https://creditrefund.com.au'
        }, {
            'batch': ['resources/templates/partials']
        }))
        .pipe(rename({'extname': '.html'}))
        .pipe(gulp.dest('public/'));
});

gulp.task('_prepareResourcesForTemplates', gulpSequence('styles', 'scripts', ['_inlineCss', '_loadCss']));

gulp.task('_loadCss', function() {
    return gulp.src([
        'resources/assets/vendor/loadcss/src/loadCSS.js',
        'resources/assets/vendor/loadcss/src/cssrelpreload.js'
    ])
        .pipe(concat('all.css'))
        .pipe(uglify())
        .pipe(rename('loadCss.min.js'))
        .pipe(gulp.dest('resources/tmp/'));
});

gulp.task('_inlineCss', function() {
    return gulp.src('resources/assets/local/sass/inline.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename('inlineStyles.min.css'))
        .pipe(gulp.dest('resources/tmp/'));
});

gulp.task('_initDir', function() {
    mkdirp('public/assets/css/');
    mkdirp('public/assets/js/');
    mkdirp('resources/tmp');

    return gulp.src('resources/assets/local/sass/styles.scss');
});

gulp.task('styles', ['_initDir'], function() {
    return gulp.src('resources/assets/local/sass/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename('styles.min.css'))
        .pipe(rev())
        .pipe(gulp.dest('public/assets/css/'))
        .pipe(rev.manifest('resources/tmp/rev-manifest.json', {base: process.cwd()+'/resources/tmp', 'merge': true}))
        .pipe(gulp.dest('resources/tmp/'));
});

gulp.task('scripts', ['_initDir'], function() {
    return gulp.src([
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
        'resources/assets/vendor/material-design-lite/src/snackbar/snackbar.js',
        'resources/assets/vendor/material-design-lite/src/spinner/spinner.js',
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
        .pipe(rev())
        .pipe(gulp.dest('public/assets/js/'))
        .pipe(rev.manifest('resources/tmp/rev-manifest.json', {base: process.cwd()+'/resources/tmp', 'merge': true}))
        .pipe(gulp.dest('resources/tmp/'));
});
