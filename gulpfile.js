var gulp = require('gulp');
var install = require('gulp-install');
var tslint = require('gulp-tslint');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var del = require('del');
var srcmap = require('gulp-sourcemaps');
var config = require('./tasks/config');
var request = require('request');
var fs = require('fs');
var nuget = require('gulp-nuget');
 
require('./tasks/htmltasks')

gulp.task('ext:tslint', () => {
    return gulp.src([
        config.paths.project.root + '/src/**/*.ts',
        '!' + config.paths.project.root + '/src/views/htmlcontent/**/*',
        config.paths.project.root + '/test/**/*.ts'
    ])
    .pipe((tslint({
        formatter: "verbose"
    })))
    .pipe(tslint.report());
});

gulp.task('ext:compile-src', () => {
    return gulp.src([
                config.paths.project.root + '/src/**/*.ts',
                config.paths.project.root + '/typings/**/*.ts',
                '!' + config.paths.project.root + '/src/views/htmlcontent/**/*'])
                .pipe(srcmap.init())
                .pipe(ts(tsProject))
                .pipe(srcmap.write('.', {
                   sourceRoot: function(file){ return file.cwd + '/src'; }
                }))
                .pipe(gulp.dest('out/src/'));
});

gulp.task('ext:nuget-download', function(done) {
    if(fs.existsSync('nuget.exe')) {
        return done();
    }
 
    request.get('http://nuget.org/nuget.exe')
        .pipe(fs.createWriteStream('nuget.exe'))
        .on('close', done);
});

gulp.task('ext:nuget-restore', function() {
  
    var options = {
      nuget: './nuget.exe',
      configFile: './nuget.config',
      packagesDirectory: './packages'
    };
 
    return gulp.src('./packages.config')
        .pipe(nuget.restore(options));
});

gulp.task('ext:compile-tests', () => {
    return gulp.src([
                config.paths.project.root + '/test/**/*.ts',
                config.paths.project.root + '/typings/**/*.ts'])
                .pipe(srcmap.init())
                .pipe(ts(tsProject))
                .pipe(srcmap.write('.', {
                   sourceRoot: function(file){ return file.cwd + '/src'; }
                }))
                .pipe(gulp.dest('out/test/'));

});

gulp.task('ext:compile', gulp.series('ext:compile-src', 'ext:compile-tests'));

gulp.task('ext:copy-tests', () => {
    return gulp.src(config.paths.project.root + '/test/resources/**/*')
            .pipe(gulp.dest(config.paths.project.root + '/out/test/resources/'))
});

gulp.task('ext:copy-html', () => {
    return gulp.src(config.paths.project.root + '/src/views/htmlcontent/src/**/*')
            .pipe(gulp.dest(config.paths.project.root + '/out/src/views/htmlcontent/'))
});

gulp.task('ext:copy-packages', () => {
    var serviceHostVersion = "0.0.1";
    return gulp.src(config.paths.project.root + '/packages/Microsoft.SqlTools.ServiceLayer.' + serviceHostVersion + '/lib/netcoreapp1.0/**/*')
            .pipe(gulp.dest(config.paths.project.root + '/out/tools/'))
});

gulp.task('ext:copy', gulp.series('ext:copy-tests', 'ext:copy-html', 'ext:copy-packages'));

gulp.task('ext:build', gulp.series('ext:nuget-download', 'ext:nuget-restore', 'ext:compile', 'ext:copy'));

gulp.task('ext:clean', () => {
    return del('out')
});

gulp.task('build-extension', gulp.series('ext:tslint', 'ext:clean', 'ext:build'));

gulp.task('build-all', gulp.series('build-html', 'build-extension'));

gulp.task('install', function(){
    return gulp.src(['./package.json', './src/views/htmlcontent/package.json'])
                .pipe(install());
});

gulp.task('watch', function(){
    return gulp.watch(config.paths.project.root + '/src/**/*', gulp.series('build-all'))
});