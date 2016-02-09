/* globals angular */
angular.module('formula').filter('formulaInlineValues', [function() {
  "use strict";

  return function(values, params) {

    var result = [];

    angular.forEach(values, function(value) {
      
      if (value instanceof Array) {
        result.push('Array[' + value.length + ']');
      } else switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
          result.push(value);
          break;

        default:
      }
    });

    return result.join(', ');
  };
}]);
