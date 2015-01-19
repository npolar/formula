/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	
	/**
	 * @factory i18n
	 * 
	 * Service used for handling Internationalization and Localization.
	 * This service is based on the ISO 639-3 standard for language codes.
	 * 
	 * @returns A singleton for i18n handling
	 */
	
	.factory('formulaI18n',
	['formulaJsonLoader', 'formulaLog', '$q',
	function(jsonLoader, log, $q) {
		function i18n(code) {
			if(code && i18n.cache[code]) {
				return i18n.cache[code];
			}
			
			// Fallback translation
			return {
				add: 		[ 'Add', 'Click to add a new item' ],
				invalid: 	'{count} invalid fields',
				maximize: 	[ 'Maximize', 'Click to maximize item' ],
				minimize:	[ 'Minimize', 'Click to minimize item' ],
				remove:		[ 'Remove', 'Click to remove item' ],
				required:	'Required field',
				save:		[ 'Save', 'Click to save document' ],
				validate:	[ 'Validate', 'Click to validate form' ],
				
				code: null,
				fields: {},
				fieldsets: [],
				uri: null
			};
		}
		
		i18n.cache = {};
		
		/**
		 * @method add
		 * 
		 * Function used to add a new translation from JSON URI.
		 * 
		 * @param uri URI to JSON containing translation
		 * @returns $q promise object resolving to ISO 639-3 code
		 */
		
		i18n.add = function(uri) {
			var deferred = $q.defer();
			
			if(uri) {
				jsonLoader(uri).then(function(data) {
					var code = data['iso639-3'];
					
					if(code) {
						i18n.cache[code] = {
							code: code,
							fields: data.fields,
							fieldsets: data.fieldsets,
							uri: uri
						};
						
						angular.forEach(data.labels, function(val, key) {
							i18n.cache[code][key] = val;
						});
						
						deferred.resolve(code);
					} else {
						log.warning(log.codes.I18N_MISSING_CODE, { uri: uri });
					}
				});
			} else {
				deferred.reject('not a valid translation JSON URI: ' + uri);
			}
			
			return deferred.promise;
		};
		
		/**
		 * @method code
		 * 
		 * Function used to get ISO 639-3 code for a added language from URI.
		 * This function can also be used to simply check if a language is added.
		 * 
		 * @param uri URI used for language code look-up
		 * @returns ISO 639-3 code for the language if added, otherwise null
		 */
		
		i18n.code = function(uri) {
			var retCode = null;
			
			angular.forEach(i18n.cache, function(data, code) {
				if(!retCode && data.uri == uri) {
					retCode = code;
				}
			});
			
			return retCode;
		};
		
		return i18n;
	}]);
