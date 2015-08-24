'use strict';

var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var concatCss = require('gulp-concat-css');
var csso = require('gulp-csso');
var minifyHtml = require('gulp-minify-html');
var ngTemplateCache = require('gulp-angular-templatecache');
var defineModule = require('gulp-define-module');

gulp.on('error', function(err){
  console.log(err);
});

gulp.task('compile-templates', function() {
	return gulp.src('./src/templates/*.html')
	.pipe(minifyHtml({ empty: true, spare: true, quotes: true }))
	.pipe(ngTemplateCache({ module: 'formula', root: 'formula/' }))
	.pipe(gulp.dest('./src/templates/'));
});

gulp.task('compile-js', ['compile-templates'], function() {
	return gulp.src(['./src/*.js', './src/**/*.js'])
	.pipe(concat('formula.js'))
	.pipe(gulp.dest('./dist/'));
});

gulp.task('minify-js', ['compile-templates'], function(cb) {
	return gulp.src(['./src/*.js', './src/**/*.js'])
	.pipe(concat('formula.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('./dist/'));
});

gulp.task('validate-js', ['compile-templates'], function() {
	return gulp.src(['./src/*.js', './src/**/*.js'])
	.pipe(jshint({
		globals: {angular: true}
	}))
	.pipe(jshint.reporter('default'));
});

gulp.task('compile-commonjs', ['compile-templates'], function () {
	return gulp.src(['src/**/*.js'])
		.pipe(concat('formula.commonjs.js'))
		.pipe(defineModule('commonjs', { require: {angular: 'angular', tv4: 'tv4'}}))
		.pipe(gulp.dest('./dist/'));
});

gulp.task('compile-css', function() {
	return gulp.src('./src/*.css')
	.pipe(concatCss('formula.css'))
	.pipe(gulp.dest('./dist/'));
});

gulp.task('minify-css', function() {
	return gulp.src('./src/*.css')
	.pipe(concatCss('formula.min.css'))
	.pipe(csso())
	.pipe(gulp.dest('./dist/'));
});

gulp.task('validate', [
	'validate-js'
]);

gulp.task('default', [
	'validate',
	'compile-js',
	'minify-js',
	'compile-commonjs',
	'compile-css',
	'minify-css'
]);

gulp.task('watch', ['default'], function() {
	gulp.watch('./src/**', ['default']);
});

gulp.task('watch-js', function() {
	gulp.watch(['./src/*.js', './src/**/*.js'], ['compile-js', 'minify-js', 'compile-commonjs']);
});

gulp.task('watch-css', function() {
	gulp.watch('./src/*.css', ['compile-css', 'minify-css']);
});
