const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;

gulp.task('scripts', function () {
  return gulp.src([
    './js/fuse.js',
    './js/hyperlink.cool.js'
  ])
    .pipe(concat('hyperlink.cool.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('js'));
});

gulp.task('watch', function () {
  gulp.watch('./js/hyperlink.cool.js', ['scripts']);
});

gulp.task('default', gulp.parallel('scripts', 'watch'));
