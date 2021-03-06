/* globals angular,tv4 */
angular.module('formula').service('formulaFieldValidateService', [
  function() {
    "use strict";

    var validate = function(field, options) {
      var silent = options.silent,
        force = options.force;
      if (field.schema) {
        var result;

        if ((field.dirty || force) && (field.required || field.value !== undefined)) {
          result = tv4.validateMultiple(field.value, field.schema);
          field.valid = result.valid;
        }

        if (!field.valid && field.nullable) {
          switch (typeof field.value) {
            case 'string':
              if (!field.value || !field.value.length) {
                field.value = null;
              }
              break;

            case 'number':
              if (isNaN(field.value)) {
                field.value = null;
              }
              break;

            case 'object':
              if (field.typeOf('object') && !Object.keys(field.value).length) {
                field.value = null;
              }
              break;
          }

          // Nullable array case..
          if (field.typeOf('array') && field.values && !field.values.length) {
            field.value = null;
          }

          // TODO: Add support for null-types in tv4
          if (field.isEmpty()) {
            field.valid = true;
          }
        }

        if (!silent && result && field.valid === false) {
          if (field.typeOf('array') || field.typeOf('object')) {
            field.errors = result.errors;
          } else {
            field.error = result.errors[0];
          }
        } else {
          field.error = null;
          field.errors = null;
        }
        field.dirty = false;

        return field.valid !== false;
      }
      return false;
    };

    return {
      validate: validate
    };
  }
]);
