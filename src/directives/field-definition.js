"use strict";
/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaFieldDefinition',
	function() {
		return {
			restrict: 'A',
			require: '^formula',
			compile: function(element, attrs) {
				attrs.$set('formulaFieldDefinition'); // unset
				var html = element.html();

				return function(scope, element, attrs, controller) {
					controller.fieldDefinition = html;
				};
			}
		};
	});
