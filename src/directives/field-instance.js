"use strict";
/* globals angular */

(function() {
/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaFieldInstance',
	['$compile',
	function($compile) {
		return {
			restrict: 'AE',
			require: '^formula',
			scope: { field: '=' },
			link: function(scope, element, attrs, controller) {
				element[0].innerHTML = controller.fieldDefinition;
				$compile(element.contents())(scope);
			}
		};
	}]);


})();
