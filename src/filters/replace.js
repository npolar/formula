/* globals angular */
angular.module('formula').filter('formulaReplace', [function() {
  "use strict";

  return function(input, params) {
    var result = input;

    (input.match(/\{[^\}]*\}/g) || [])
    .forEach(function(val) {
      result = result.replace(val, params[val.substr(1, val.length - 2)]);
    });

    return result;
  };
}]);
