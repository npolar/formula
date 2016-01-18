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

	/**
	 * @filter replace
	 *
	 * Filter used to replace placeholders in a string.
	 */

	.filter('formulaReplace', [function() {
		return function(input, params) {
			var result = input;

			(input.match(/\{[^\}]*\}/g) || [])
			.forEach(function(val) {
				result = result.replace(val, params[val.substr(1, val.length - 2)]);
			});

			return result;
		};
	}]);

})();
