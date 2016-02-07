/* globals angular */
angular.module('formula').factory('formulaJsonLoader', ['$http', '$q', 'formulaLog',
  function($http, $q, log) {
    "use strict";

    var jsonLoader;

    return (jsonLoader = function(uri, jsonp, rerun) {
      var deferred = $q.defer();
      if (typeof uri !== "string") { // uri is not uri but schema object
        deferred.resolve(uri);
      } else {
        (jsonp ? $http.jsonp(uri + '?callback=JSON_CALLBACK') : $http.get(uri))
        .success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).error(function(data, status, headers, config) {
          if (!jsonp) {
            return jsonLoader(uri, true);
          }

          log.error(log.codes.JSON_LOAD_ERROR, {
            uri: uri
          });
          deferred.reject(uri);
        });
      }

      return deferred.promise;
    });
  }
]);
