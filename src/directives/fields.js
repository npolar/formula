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
    .directive('formulaFields', ['$compile', 'formulaClassService',
      function($compile, formulaClassService) {



        return {
          restrict: 'AE',
          scope: {
            fields: '='
          },
          link: function (scope, iElement, iAttrs) {
            scope.fields.forEach(function (field) {
              if (!field.hidden && field.template) {
                var fieldScope = scope.$new();
                var elem = angular.element(field.template);
                console.log('compile fields', field.path);
                fieldScope.field = field;
                formulaClassService.addPathClass(field, elem);
                formulaClassService.addSchemaClass(field, elem);
                $compile(elem)(fieldScope, function(cloned, scope) {
                  iElement.append(cloned);
                });
              }
            });
          },
        };
      }
    ]);
})();
