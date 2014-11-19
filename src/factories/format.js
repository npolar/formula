/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	
	/**
	 * @factory format
	 * 
	 * Service used for generating JSON Schema format validation functions.
	 * 
	 * @returns object with supported format properties as tv4 addFormat functions
	 */
	
	.factory('formulaFormat',
	function() {
		return {
			color: // CSS 2.1 color
			function(data, schema) {
				var colors = "aqua,black,blue,fuchsia,gray,green,lime,maroon,navy,olive,orange,purple,red,silver,teal,white,yellow";
				if(typeof data == 'string' && (colors.split(',').indexOf(data) != -1 || /^(#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})|rgb\(\s?\d{1,3}%?,\s?\d{1,3}%?,\s?\d{1,3}%?\s?\))$/.test(data))) {
					return null;
				}
				return 'CSS 2.1 color';
			},
			date:  // ISO 8601 date
			function(data, schema) {
				if(typeof data == 'string' && /^\d{4}(-\d{2}){2}$/.test(data)) {
					return null;
				}
				return 'ISO 8601 date';
			},
			datetime: // ISO 8601 datetime combination
			function(data, schema) {
				if(typeof data == 'string' && /^\d{4}(-\d{2}){2}T\d{2}(:\d{2}){2}(.\d+)?(([+-](\d{2}|\d{4}|\d{2}:\d{2}))|Z)$/.test(data)) {
					return null;
				}
				return 'ISO 8601 datetime';
			},
			time: // ISO 8601 time
			function(data, schema) {
				if(typeof data == 'string' && /^\d{2}(:\d{2}){2}$/.test(data)) {
					return null;
				}
				return 'ISO 8601 time';
			},
			uri: // RFC 3986 URI
			function(data, schema) {
				if(typeof data == 'string' && /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i.test(data)) {
					return null;
				}
				return 'RFC 3986 URI';
			}
		};
	});
