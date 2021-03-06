'use strict';

var fs = require('fs');
var gulpWatch = require('gulp-watch');

var streams = {};
var watched = {};

function Watcher ($events, $file, $tracer) {
  this._events = $events;
  this._file = $file;
  this._tracer = $tracer;
}

Watcher.prototype = {
  watch: function (bundle, callback) {
    var that = this;
    var watcher = gulpWatch(bundle.files, function (file) {
      that._file(file.path).expire();

      if (watched[file.path]) {
        return;
      }

      watched[file.path] = true;
      that._events.emit('watch', file.path);
      bundle.all.forEach(function (bundleFile) {
        // Individual watchers don't need to be re-created.
        if (streams[bundleFile]) {
          return;
        }

        // Create an individual watcher for this file.
        streams[bundleFile] = gulpWatch(bundleFile, function (bundleFileVinyl) {
          bundleFile = bundleFileVinyl.path;

          // If we don't uncache it then the file won't change and no new files
          // will be picked up.
          that._file(bundleFile).expire();

          // We actually have to write the main file to trigger a change.
          bundle.destinations(bundleFile).forEach(function (mainFile) {
            // If a bundle file was updated, then we don't need to force update
            // it. We just notify that it's been updated.
            if (watched[bundleFile]) {
              that._events.emit('update.main', bundleFile);
            } else {
              // Force update the main file
              fs.readFile(mainFile, function (err, buf) {
                fs.writeFile(mainFile, buf.toString(), function () {
                  that._events.emit('update', bundleFile, mainFile);
                  callback && callback(bundleFile, mainFile);
                });
              });
            }
          });
        });

        streams[bundleFile].on('error', function (error) {
          that._events.emit('error', error, bundleFile);
        });
      });
    });

    watcher.on('close', function () {
      Object.keys(streams).forEach(function (name) {
        streams[name].unwatch();
        streams[name].close();
        delete streams[name];
      });
    });

    watcher.on('error', function (error) {
      that._events.emit('error', error);
    });

    return watcher;
  }
};

module.exports = Watcher;
