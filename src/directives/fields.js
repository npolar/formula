/* globals angular */
angular.module('formula').directive('formulaFields', ['$compile', 'formulaClassService', 'formulaI18n',
  function($compile, formulaClassService, i18n) {
    "use strict";


    return {
      restrict: 'AE',
      scope: {
        fields: '='
      },
      compile: function(tElement, tAttrs) {
        if (tElement.html()) {
          var innerTemplate = tElement.html();
          tElement.empty();
        }
        return function link(scope, iElement, iAttrs) {
          scope.i18n = i18n;
          scope.fields.forEach(function(field) {
            var fieldScope = scope.$new();
            fieldScope.field = field;
            fieldScope.parent = field.parents[field.parents.length - 1];
            var template = innerTemplate || '<formula:field field="field"></formula:field>';
            if (!field.hidden && template) {
              $compile(template)(fieldScope, function(cloned, scope) {
                iElement.append(cloned);
              });
            }
          });
        };
      }
    };
  }
]);
