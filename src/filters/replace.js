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
	
	.filter('formulaReplace', function() {
		return function(input, params) {
			var result = input, match = input.match(/\{[^\}]*\}/g);
			
			angular.forEach(match, function(v, k) {
				result = result.replace(v, params[v.substr(1, v.length - 2)]);
			});
			
			return result;
		};
	});
