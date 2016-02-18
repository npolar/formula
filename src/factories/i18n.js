/* globals angular, tv4 */
angular.module('formula').factory('formulaI18n', ['formulaJsonLoader', 'formulaLog', '$q',
  function(jsonLoader, log, $q) {
    "use strict";


    var DEFAULT_TEXTS = {
      code: 'en',
      text: {
        add: {
          label: 'Add',
          tooltip: 'Click to add a new item'
        },
        invalid: '{count} invalid fields',
        moveup: 'Move item up',
        movedown: 'Move item down',
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
        item: 'Item {item}: {error}',
      },

      fields: {},
      fieldsets: []
    };

    var currentLocale = DEFAULT_TEXTS;
    var cache = {};
    var languagePromises = {};
    var codeAliases = {};

    var set = function(code) {
      var cacheKey = codeAliases[code];
      tv4.language(cacheKey.replace('_', '-'));
      if (languagePromises[cacheKey]) {
        return Promise.resolve(languagePromises[cacheKey]).then(function(locale) {
          currentLocale = locale;
          currentLocale.code = cacheKey;
        });
      }

    };

    var addTv4 = function(lang, key) {
      if (lang.tv4) {
        tv4.addLanguage(key.replace('_', '-'), lang.tv4);
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
      languagePromises[cacheKey] = deferred.promise;

      if (typeof lang === 'string') { // lang is uri
        jsonLoader(lang).then(function(data) {
          var translations = cache[cacheKey] || {};
          cache[cacheKey] = angular.merge(translations, data);
          addTv4(cache[cacheKey], cacheKey);
          deferred.resolve(cache[cacheKey]);
        });
      } else { // lang is map
        var translations = cache[cacheKey] || {};
        cache[cacheKey] = angular.merge(translations, lang);
        addTv4(cache[cacheKey], cacheKey);
        deferred.resolve(cache[cacheKey]);
      }

      return deferred.promise;
    };

    add(DEFAULT_TEXTS, 'en');

    return {
      add: add,
      set: set,
      get fields() {
        return currentLocale.fields;
      },
      get fieldsets() {
        return currentLocale.fieldsets;
      },
      get text() {
        return currentLocale.text;
      },
      get code() {
        return currentLocale.code;
      }
    };
  }
]);
