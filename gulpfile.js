var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

var paths = {
    scripts: ['./js/*.js', '!./js/*.min.js']
};

gulp.task('js', function() {
    return gulp.src([
            './js/fuse.js',
            './js/hyperlink.cool.js',
            '!./js/hyperlink.cool.min.js'
        ])
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('hyperlink.cool.min.js'))
        .pipe(uglify().on('error', gutil.log))
        .pipe(gulp.dest('js'));
});

gulp.task('watch', function() {
    gulp.watch(['./js/**/*.js'], ['js']);
});

gulp.task('default', ['js', 'watch']);
