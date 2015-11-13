var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var paths = {
    scripts: ['./js/*.js']
};

gulp.task('scripts', function() {
    return gulp.src(paths.scripts)
        .pipe(uglify())
        .pipe(concat('vlaume.min.js'))
        .pipe(gulp.dest('js'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(['./js/**/*.js', '!./js/vlaume.min.js'], ['scripts']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['scripts', 'watch']);
