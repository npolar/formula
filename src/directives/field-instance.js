"use strict";
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
			compile: function() {
				// TODO: append element.html() to element?

				return function(scope, element, attrs, controller) {
					var elem = angular.element(controller.fieldDefinition);
					$compile(elem)(scope, function (cloned, scope) {
						element.prepend(cloned);
					});
				};
			}
		};
	}]);
