'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var Galvatron = require('../index');
var mocha = require('mocha');
var tmp = require('tmp');

function triggerChange (file, done) {
  fs.readFile(file, function (err, buf) {
    fs.writeFile(file, buf.toString(), done);
  });
}

function makeRequire (path) {
  return 'require("' + path + '");';
}

function makeFiles (paths) {
  return paths.map(function (path) {
    return fs.readFileSync(path);
  }).join('\n\n');
}

mocha.describe('watching', function () {
  var bundle;
  var file1;
  var file2;
  var file3;
  var file4;
  var galv;

  mocha.beforeEach(function () {
    galv = new Galvatron();
    file1 = tmp.fileSync();
    file2 = tmp.fileSync();
    file3 = tmp.fileSync();
    file4 = tmp.fileSync();

    fs.writeFileSync(file1.name, makeRequire(file3.name));
    fs.writeFileSync(file2.name, makeRequire(file3.name));
    fs.writeFileSync(file3.name, makeRequire(file4.name));

    bundle = galv.bundle([
      file1.name,
      file2.name
    ], {
      common: file1.name
    });
  });

  mocha.it('should return common dependencies', function () {
    expect(bundle.common()).to.equal(makeFiles([file4.name, file3.name]));
  });

  mocha.it('should return uncommon dependencies', function () {
    expect(bundle.uncommon()).to.equal(makeFiles([file1.name, file2.name]));
  });

  mocha.it('should bundle dependencies for files that match the common option', function () {
    expect(bundle.join(file1.name)).to.equal(makeFiles([file4.name, file3.name, file1.name]));
  });

  mocha.it('should not bundle dependencies for files that do not match the common option', function () {
    expect(bundle.join(file2.name)).to.equal(makeFiles([file2.name]));
  })
});
