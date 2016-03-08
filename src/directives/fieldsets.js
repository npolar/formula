/* globals angular */
angular.module('formula').directive('formulaFieldsets', ['$compile', 'formulaClassService',
  function($compile, formulaClassService) {
    "use strict";

    return {
      restrict: 'AE',
      require: '?^^form',
      link: function(scope, iElement, iAttrs, formController) {
        scope.form.fieldsets.forEach(function(fieldset) {
          var template = fieldset.template;
          if (!fieldset.hidden && template) {
            var fieldsetScope = scope.$new();
            var elem = angular.element(template);
            fieldsetScope.fieldset = fieldset;
            elem.addClass(formulaClassService.schemaClass(fieldset));
            $compile(elem)(fieldsetScope, function(cloned, scope) {
              iElement.append(cloned);
            });

            if (formController) {
              formController.$setPristine();
            }
          }
        });
      }
    };
  }
]);
