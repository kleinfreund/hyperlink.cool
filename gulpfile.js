const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;

gulp.task('js', function () {
  return gulp.src([
    './js/fuse.js',
    './js/hyperlink.cool.js',
    '!./js/hyperlink.cool.min.js'
  ])
    .pipe(concat('hyperlink.cool.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('js'));
});

gulp.task('watch', function () {
  gulp.watch(['./js/**/*.js'], ['js']);
});

gulp.task('default', gulp.parallel('js', 'watch'));
