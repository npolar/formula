/* globals angular, tv4 */

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
   * @factory i18n
   *
   * Service used for handling Internationalization and Localization.
   * This service is based on the ISO 639-3 standard for language codes.
   *
   * @returns A singleton for i18n handling
   */

  .factory('formulaI18n', ['formulaJsonLoader', 'formulaLog', '$q',
    function(jsonLoader, log, $q) {

      var DEFAULT_TEXTS = {
				code: 'en',
        text: {
          add: {
            label: 'Add',
            tooltip: 'Click to add a new item'
          },
          invalid: '{count} invalid fields',
          maximize: {
            label: 'Maximize',
            tooltip: 'Click to maximize item'
          },
          minimize: {
            label: 'Minimize',
            tooltip: 'Click to minimize item'
          },
          remove: {
            label: 'Remove',
            tooltip: 'Click to remove item'
          },
          required: 'Required field',
          save: {
            label: 'Save',
            tooltip: 'Click to save document'
          },
          validate: {
            label: 'Validate',
            tooltip: 'Click to validate form'
          },
          line: 'Line {line}: {error}',
        },

        fields: {},
        fieldsets: []
      };

      var currentLocale = DEFAULT_TEXTS;
      var cache = {};
      var codeAliases = {};

      var set = function(code) {
        var cacheKey = codeAliases[code];
        tv4.language(cacheKey.replace(/_.*/, ''));
        if (cache[cacheKey]) {
          return Promise.resolve(cache[cacheKey]).then(function (locale) {
            currentLocale = locale;
            currentLocale.code = cacheKey;
          });
        }

      };

      /**
       * @method add
       *
       * Function used to add a new translation from JSON URI.
       *
       * @param lang URI to JSON containing translation or translation object
       * @param code for this translation
       * @param code aliases. eg. no => nb => nb_NO
       * @returns $q promise object resolving to ISO 639-3 code
       */

      var add = function(lang, code, aliases) {
        if (!lang) {
          log.warning(log.codes.I18N_MISSING_URI);
          return;
        }
        if (!code) {
          log.warning(log.codes.I18N_MISSING_CODE, {
            uri: lang
          });
          return;
        }

        var deferred = $q.defer();
        (aliases instanceof Array ? aliases : [aliases])
        .forEach(function(alias) {
          codeAliases[alias] = code;
        });
        codeAliases[code] = code;
        var cacheKey = codeAliases[code];
				cache[cacheKey] = deferred.promise;

        if (typeof lang === 'string') { // lang is uri
          jsonLoader(lang).then(function(data) {
            cache[cacheKey] = {
              fields: data.fields,
              fieldsets: data.fieldsets,
              text: data.text
            };

            deferred.resolve(cache[cacheKey]);
          });
        } else { // lang is map
          cache[cacheKey] = lang;
          deferred.resolve(lang);
        }

        return deferred.promise;
      };

      return {
				add: add,
				set: set,
				get fields() { return currentLocale.fields; },
        get fieldsets() { return currentLocale.fieldsets; },
        get text() { return currentLocale.text; },
				get code() { return currentLocale.code; }
			};
    }
  ]);

})();
