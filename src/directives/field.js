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
    .directive('formulaField', ['$compile', 'formulaClassService',
      function($compile, formulaClassService) {

        return {
          restrict: 'AE',
          scope: {
            field: '='
          },
          link: function (scope, iElement, iAttrs) {
            var field = scope.field;
            if (!field.hidden && field.template) {
              var fieldScope = scope.$new();
              var elem = angular.element(field.template);
              console.log('compile field', field.path, elem);
              fieldScope.field = field;
              formulaClassService.addPathClass(field, elem);
              formulaClassService.addSchemaClass(field, elem);
              $compile(elem)(fieldScope, function(cloned, scope) {
                iElement.append(cloned);
              });
            }
          },
        };
      }
    ]);
})();
