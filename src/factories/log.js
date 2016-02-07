/* globals angular,console */
angular.module('formula').factory('formulaLog', [
  function() {
    "use strict";

    var codes = {
      FIELD_INVALID_ID: 'field ID contains an illegal character: {character} ({field})',
      FIELD_MISSING_PROPERTY: 'missing required field property: {property} ({field})',
      FIELD_UNSUPPORTED_FORMAT: 'unsupported string format: {format} ({field})',
      FIELD_UNSUPPORTED_PROPERTY: 'unsupported field property: {property} ({field})',
      FIELD_UNSUPPORTED_TOKEN: 'unsupported default token: {token} ({field})',
      FIELD_UNSUPPORTED_TYPE: 'unsupported field type: {type} ({field})',
      FIELD_HIDDEN_DEFAULT: 'field hidden by default: {field}',
      I18N_MISSING_CODE: 'missing language code: {uri}',
      I18N_MISSING_URI: 'missing i18n uri',
      JSON_LOAD_ERROR: 'could not load JSON document: {uri}',
      SCHEMA_INVALID_URI: 'invalid URI for schema deref: {uri}',
      SCHEMA_MISSING_PROPERTY: 'missing required schema property: {property} ({schema})',
      SCHEMA_MISSING_REFERENCE: 'missing schema reference: {schema}',
      MISSING_TEMPLATE: 'missing template for {missing}'
    };

    function codeTranslate(code, params) {
      var msg = code,
        match = msg.match(/\{[^\}]*\}/g);
      angular.forEach(match, function(v, k) {
        msg = msg.replace(v, params[v.substr(1, v.length - 2)]);
      });
      return msg;
    }

    return {
      codes: codes,
      debug: function(msg, params) {
        if (params) {
          console.debug(codeTranslate(msg, params));
        } else {
          console.debug(msg);
        }
      },
      error: function(code, params) {
        console.error(codeTranslate(code, params));
      },
      warning: function(code, params) {
        console.warn(codeTranslate(code, params));
      }
    };
  }
]);
