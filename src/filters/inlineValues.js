/* globals angular */
angular.module('formula').filter('formulaInlineValues', [function() {
  "use strict";

  return function(input, params) {

    var result = [];

    angular.forEach(input, function(field) {
      if (field.value instanceof Array) {
        result.push('Array[' + field.value.length + ']');
      } else switch (typeof field.value) {
        case 'string':
        case 'number':
        case 'boolean':
          result.push(field.value);
          break;

        default:
      }
    });

    return result.join(', ');
  };
}]);
