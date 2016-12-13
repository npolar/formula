/* globals angular */
angular.module('formula').factory('formulaJsonLoader', ['$http', '$q', 'formulaLog',
  function($http, $q, log) {
    'use strict';

    var jsonLoader;

    return (jsonLoader = function(uri, jsonp, rerun) {
      var deferred = $q.defer();
      if (typeof uri !== 'string') { // uri is not uri but schema object
        deferred.resolve(uri);
      } else {
        (jsonp ?  $http.jsonp(uri, {jsonpCallbackParam: 'JSON_CALLBACK'}) : $http.get(uri))
        .then(function(r) {
          deferred.resolve(r.data);
        }, function(r) {
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
