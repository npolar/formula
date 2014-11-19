/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	
	/**
	 * @factory jsonLoader
	 * 
	 * Service used for asynchronous loading of JSON files.
	 * 
	 * @param uri JSON file uri as a string
	 * @returns $q promise object to requested JSON file
	 */
	
	.factory('formulaJsonLoader',
	['$http', '$q',
	function($http, $q) {
		return function(uri, jsonp) {
			var deferred = $q.defer();
			
			if(jsonp === undefined) {
				jsonp = (uri.search(/https?:/) === 0);
			}
			
			(jsonp ? $http.jsonp(uri + '?callback=JSON_CALLBACK') : $http.get(uri))
				.success(function(data, status, headers, config) {
					deferred.resolve(data);
				}).error(function(data, status, headers, config) {
					deferred.reject('Could not load JSON from ' + uri);
				});
			return deferred.promise;
		};
	}]);
