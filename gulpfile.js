'use strict';
// IMPORTS
// ================================================================================================
const gulp  = require('gulp');
const del   = require('del');
const exec  = require('child_process').exec;
const mocha = require('gulp-mocha');

// TASKS
// ================================================================================================
function clean(cb) {
  del(['bin']).then(() => { cb(); });
}

function compile(cb) {
  exec('tsc -p .', function (err, stdout, stderr) {
    if (stdout.length > 0) console.log(stdout);
    if (stderr.length > 0) console.error(stderr);
    cb(err);
  });
}

function asbuild(cb) {
  const source = 'lib/assembly/prime128.as';
  const target =  '/bin/lib/assembly/prime128.wasm';
  exec(`npx asc ${source} -b ${target} --sourceMap --validate --importMemory -O3`, function (err, stdout, stderr) {
    if (stdout.length > 0) console.log(stdout);
    if (stderr.length > 0) console.error(stderr);
    cb(err);
  });
}

function copyFiles(cb) {
  gulp.src('./package.json').pipe(gulp.dest('./bin'));
  gulp.src('./package-lock.json').pipe(gulp.dest('./bin'));
  gulp.src('./galois.d.ts').pipe(gulp.dest('./bin'));
  gulp.src('./.npmignore').pipe(gulp.dest('./bin'));
  gulp.src('./README.md').pipe(gulp.dest('./bin'));
  cb();
}

function publish(cb) {
  exec('npm publish bin --access=public', function (err, stdout, stderr) {
    if (stdout.length > 0) console.log(stdout);
    if (stderr.length > 0) console.error(stderr);
    cb(err);
  });
}

function runTests(cb) {
    gulp.src('./bin/tests/**/*.spec.js')
        .pipe( mocha({reporter: 'spec', bail: false}))
        .on('error', err => {
            if (err && (!err.message || err.message !== 'There were test failures')) {
                console.error(JSON.stringify(err, null, 2));
            }
        } )
        .once('error', () => process.exit(1))
        .on('end', () => process.exit(0));
    cb();
}

const build = gulp.series(clean, asbuild, compile, copyFiles);

// EXPORTS
// ================================================================================================
exports.build = build;
exports.publish = gulp.series(build, publish);
exports.test = gulp.series(build, runTests);
exports.default = build;