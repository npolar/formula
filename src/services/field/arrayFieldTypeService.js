/* globals angular */
angular.module('formula').service('formulaArrayFieldTypeService', ['$filter', 'formulaLog', 'formulaFormat',
  function($filter, log, format) {
    "use strict";

    var applyType = function(field) {
      field.mainType = 'array';
      field.values = [];
      if (field.schema.items) {
        var items = field.schema.items;

        if (items.type === 'object') {
          field.type = 'array:fieldset';
        } else if (items.type === 'array') {
          field.type = 'array:array';
        } else if (items.allOf) {
          // @TODO
          log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
            property: 'allOf',
            field: field.path
          });
        } else if (items.anyOf) {
          // @TODO
          log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
            property: 'anyOf',
            field: field.path
          });
        } else if (items.oneOf) {
          // @TODO
          log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
            property: 'oneOf',
            field: field.path
          });
        } else {
          field.type = 'array:field';
        }
        if (field.schema.minItems >= 1) {
          field.required = true;
        }
      } else {
        log.warning(log.codes.FIELD_MISSING_PROPERTY, {
          property: 'items',
          field: field.path
        });
        field.type = null;
      }
    };


    return {
      applyType: applyType
    };
  }
]);
