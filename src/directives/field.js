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
        scope.i18n = i18n;
        var template = field.template || field.matchedTemplate;
        if (!field.hidden && template) {
          var fieldScope = scope.$new();
          var elem = angular.element(template);
          fieldScope.field = field;
          elem.addClass(formulaClassService.pathClass(field));
          elem.addClass(formulaClassService.schemaClass(field));
          $compile(elem)(fieldScope, function(cloned, scope) {
            iElement.append(cloned);
          });
        }
      },
    };
  }
]);
