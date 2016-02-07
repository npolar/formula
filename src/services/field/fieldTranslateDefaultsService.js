/* globals angular */
angular.module('formula').service('formulaFieldTranslateDefaultsService', ['$filter', 'formulaLog',
  function($filter, log) {
    "use strict";

    var translateDefaultValues = function(field) {
      if (typeof field.default === 'string') {
        var match = field.default.match(/^%(.*)%$/),
          replace;
        if (match) {
          switch (match[1]) {
            case 'date':
              replace = $filter('date')(new Date(), 'yyyy-MM-dd', 'UTC');
              break;

            case 'datetime':
              replace = $filter('date')(new Date(), 'yyyy-MM-ddThh:mm:ss', 'UTC') + 'Z';
              break;

            case 'time':
              replace = $filter('date')(new Date(), 'hh:mm:ss', 'UTC');
              break;

            case 'year':
              replace = $filter('date')(new Date(), 'yyyy', 'UTC');
              break;

            default:
              log.warning(log.codes.FIELD_UNSUPPORTED_TOKEN, {
                token: match[1],
                field: field.path
              });
          }

          if (replace) {
            field.default = replace;
          }
        }
      }
    };
    return {
      translateDefaultValues: translateDefaultValues
    };
  }
]);
