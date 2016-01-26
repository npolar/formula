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
  .service('formulaAutoCompleteService', ['$http', '$q',
    function($http, $q) {

      var URI_REGEX = /^(https?|\/\/)/;
      var ERR = "Invalid autocomplete source ";

      var sources = {};
      var selects = {};

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

      var bindSourceCallback = function(fieldPath, cb) {
        sources[fieldPath] = cb;
      };

      var bindSelectCallback = function(fieldPath, cb) {
        selects[fieldPath] = cb;
      };

      var filterSource = function (source, q) {
        if (!q || typeof source[0] !== "string") {
          return source;
        }
        source = source.filter(function (item) {
          return item.toLowerCase().indexOf(q.toLowerCase()) === 0;
        });
        return source;
      };

      var getSource = function(field, source, q) {
        var deferred = $q.defer();

        if (URI_REGEX.test(source)) {
          // source is uri
          var config = {
            params: {
              q: q || ''
            }
          };
          $http.get(source, config).then(function (response) {
            deferred.resolve(getSource(field, response.data, q));
          }, function (response) {
            deferred.reject(new Error(ERR + source));
          });
        } else {
          if (source.constructor !== Array) {
            source = [];
          }

          // source is a registred function
          if (isFn(field.path)) {
            deferred.resolve(filterSource(sources[field.path].call(field, source), q));
          } else if (isFn(field.id)) {
            deferred.resolve(filterSource(sources[field.id].call(field, source), q));
          } else {
            deferred.resolve(filterSource(source, q));
          }
        }

        return deferred.promise;
      };

      var initField = function (field) {
        field.source = [];
        field.onSelect = function (item) {
          if (selects[field.path]) {
            selects[field.path].call(field, item);
          }
        };
        field.querySearch = function (q) {
          return getSource(field, field.autocomplete, q);
        };
      };

      return {
        bindSourceCallback: bindSourceCallback,
        bindSelectCallback: bindSelectCallback,
        getSource: getSource,
        isURI: isURI,
        initField: initField
      };
    }
  ]);

})();
