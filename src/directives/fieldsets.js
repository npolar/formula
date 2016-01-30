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
	.directive('formulaFieldsets',
	['$compile', 'formulaClassService',
	function($compile, formulaClassService) {
		return {
			restrict: 'AE',
			require: '^^formula',
			link: function(scope, iElement, iAttrs, controller) {
				scope.form.fieldsets.forEach(function (fieldset) {
					console.log('compile fieldset');
					if (!fieldset.hidden && fieldset.template) {
						var fieldsetScope = scope.$new();
						var elem = angular.element(fieldset.template);
						fieldsetScope.fieldset = fieldset;
						formulaClassService.addSchemaClass(fieldset, elem);
						$compile(elem)(fieldsetScope, function(cloned, scope) {
							iElement.append(cloned);
						});
					}
				});
			}
		};
	}]);


})();
