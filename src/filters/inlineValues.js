/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	
	/**
	 * @filter inlineValues
	 * 
	 * Filter used to inline an array of values.
	 */
	
	.filter('formulaInlineValues', function() {
		return function(input, params) {
			var result = [];
			
			angular.forEach(input, function(field) {
				if(field.value === null) {
					result.push('null');
				} else if(field.value === undefined) {
					result.push('undefined');
				} else if(field.value instanceof Array) {
					result.push('Array[' + field.value.length + ']');
				} else switch(typeof field.value) {
					case 'string':
						var strlen = field.value.length;
						
						if(strlen && strlen < 10) {
							result.push(field.value);
						} else if(strlen) {
							result.push(field.value.substr(0, 10) + '...');
						}
						
						break;
						
					case 'number':
					case 'boolean':
						result.push(field.value);
						break;
						
					default:
						result.push('Object');
				}
			});
			
			return result.join(', ');
		};
	});
