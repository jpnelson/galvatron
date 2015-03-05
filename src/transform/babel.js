'use strict';

var babel = require('babel');

module.exports = function () {
  return function (data) {
    return babel.transform(data, {
      // We have no idea what any dependencies might be up to. This
      // ensures backward compatibility even though ES6 is strict.
      blacklist: ['useStrict'],
      modules: 'common'
    }).code;
  };
};
