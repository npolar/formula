/* globals angular */

(function() {
"use strict";

  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */
  angular.module('formula')
    .directive('formulaFields', ['$compile', 'formulaClassService', 'formulaI18n',
      function($compile, formulaClassService, i18n) {

        return {
          restrict: 'AE',
          scope: {
            fields: '='
          },
          compile: function (tElement, tAttrs) {
            if (tElement.html()) {
              var innerTemplate = tElement.html();
              tElement.empty();
            }
            return function link (scope, iElement, iAttrs) {
              scope.i18n = i18n;
              scope.fields.forEach(function (field) {
                // Only compile fields that have template
                if (!field.hidden && field.template) {
                  var fieldScope = scope.$new();
                  var elem = angular.element(innerTemplate || field.template);
                  fieldScope.field = field;
                  fieldScope.parent = field.parents[field.parents.length - 1];
                  elem.addClass(formulaClassService.pathClass(field));
                  elem.addClass(formulaClassService.schemaClass(field));
                  $compile(elem)(fieldScope, function(cloned, scope) {
                    iElement.append(cloned);
                  });
                }
              });
            };
          }
        };
      }
    ]);
})();
