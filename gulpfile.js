var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var paths = {
    scripts: ['./js/*.js', '!./js/*.min.js']
};

gulp.task('js', function() {
    return gulp.src(paths.scripts)
        .pipe(concat('vlaume.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('js'));
});

gulp.task('watch', function() {
    gulp.watch(['./js/**/*.js'], ['js']);
});

gulp.task('default', ['js', 'watch']);
