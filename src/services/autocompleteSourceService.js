"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaAutoCompleteService', ['$http', '$q',
    function($http, $q) {

      const URI_REGEX = /^(https?|\/\/)/;
      const ERR = "Invalid autocomplete source ";

      var sources = {};

      var isFn = function(key) {
        return sources[key] && sources[key].constructor === Function;
      };

      var isObject = function(source) {
        return source.constructor === Object &&
          source.hasOwnProperty('source') && source.hasOwnProperty('callback');
      };

      var isURI = function(source) {
        return source && (URI_REGEX.test(source) || (isObject(source) && isURI(source.source)));
      };

      var defineSourceFunction = function(key, cb) {
        sources[key] = cb;
      };

      var getSource = function(source, q) {
        var deferred = $q.defer();

        if (isFn(source)) {
          // source is a registred function
          deferred.resolve(sources[source].call({}));
        } else if (URI_REGEX.test(source)) {
          // source is uri
          var config = q ? {
            params: {
              q: q
            }
          } : {};
          $http.get(source, config).then(function (response) {
            deferred.resolve(response.data);
          }, function (response) {
            deferred.reject(new Error(ERR + source));
          });
        } else if (source.constructor === Array) {
          // source is array
          deferred.resolve(source);
        } else if (isObject(source)) {
          // source is object
          getSource(source.source, q).then(function (response) {
            if (isFn(source.callback)) {
              deferred.resolve(sources[source.callback].call({}, response));
            } else {
              deferred.resolve(response);
            }
          }, function (response) {
            deferred.reject(new Error(ERR + source));
          });
        } else {
          deferred.resolve(source.filter(function (item) { return item.indexOf(q) !== -1; }));
        }

        return deferred.promise;
      };

      var initField = function (field) {
        field.source = [];
        getSource(field.autocomplete).then(function (source) {
          field.source = source;
        }, function (e) {
          console.warn(e);
          field.source = [];
        });
        field.querySearch = function (q) {
          return getSource(field.autocomplete, q);
        };
      };

      return {
        defineSourceFunction: defineSourceFunction,
        getSource: getSource,
        isURI: isURI,
        initField: initField
      };
    }
  ]);
