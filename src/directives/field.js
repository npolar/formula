/* globals angular */
angular.module('formula').directive('formulaField', ['$compile', 'formulaClassService', 'formulaI18n',
  function($compile, formulaClassService, i18n) {
    "use strict";

    return {
      restrict: 'AE',
      scope: {
        field: '='
      },
      link: function(scope, iElement, iAttrs) {
        var field = scope.field;
        iElement.addClass(formulaClassService.pathClass(field));
        iElement.addClass(formulaClassService.schemaClass(field));
        if (field.required) {
          iElement.addClass('required');
        }
        scope.i18n = i18n;
        scope.$watch('field.template', function (template) {
          if (!field.hidden && field.template) {
            iElement.html(field.template);
            $compile(iElement.contents())(scope);
            field._elem_q.resolve(iElement);
          } else {
            field._elem_q.reject(iElement);
          }
        });
      },
    };
  }
]);
