/* globals angular,tv4 */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldTypeService', ['$filter', 'formulaLog', 'formulaFormat',
    function($filter, log, format) {

      var reduceFieldTypes = function(field) {
        if (field.type instanceof Array) {
          field.nullable = field.type.some(function(type) {
            return type === 'null';
          });
          if (field.type.length === 1) {
            field.type = field.type[0];
          } else if (field.type.length === 2) {
            if (field.type[0] === 'null') {
              field.type = field.type[1];
            } else if (field.type[1] === 'null') {
              field.type = field.type[0];
            }
          } else {
            field.types = field.type;
            field.type = 'any';
            // @TODO support any
          }
          field.mainType = field.type;
        } else {
          field.mainType = field.schema.type;
        }
      };



      /**
       * Set fieldType and associated properties
       *
       * @param field
       * @param source schema or fieldDefinition
       */
      var setFieldType = function(field) {
        reduceFieldTypes(field);
        if (field.autocomplete) {
          field.type = 'input:autocomplete';
        } else if (field.type === 'select' || field.enum) {
          field.type = 'input:select';
        } else {
          if (field.format) {
            var formatNoDash = field.format.replace('-', '');

            if (format[formatNoDash]) {
              switch (formatNoDash) {
                case 'date':
                case 'datetime':
                case 'time':
                  field.type = 'input:' + formatNoDash;
                  break;
                default:
                  field.type = 'input:text';
              }

              tv4.addFormat(field.format, format[formatNoDash]);
            } else {
              log.warning(log.codes.FIELD_UNSUPPORTED_FORMAT, {
                format: field.format,
                field: field.path
              });
              field.type = 'input:text';
            }
          } else {
            switch (field.type) {
              case 'any':
                field.type = 'input:any';
                break;
              case 'array':
                field.values = [];
                if (field.schema.items) {
                  var items = field.schema.items;

                  if (items.type === 'object') {
                    field.type = 'array:fieldset';
                  } else if (items.type === 'array') {
                    field.type = 'array:array';
                  } else if (items.enum) {
                    field.enum = items.enum;
                    field.multiple = true;
                    field.type = 'input:select';
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
                break;

              case 'boolean':
              case 'checkbox':
                field.type = 'input:checkbox';
                field.value = !!field.value;
                break;

              case 'integer':
              case 'number':
                field.type = 'input:number';
                break;

              case 'range':
                field.type = 'input:range';
                break;

              case 'object':
                if (!field.schema.properties) {
                  log.warning(log.codes.FIELD_MISSING_PROPERTY, {
                    property: 'properties',
                    field: field.path
                  });
                  field.type = null;
                }
                break;

              case 'textarea':
                field.type = 'input:textarea';
                break;

              case 'string':
              case 'text':
                field.type = 'input:text';
                break;
              case undefined:
                field.type = 'input:text';
                break;

              default:
                log.warning(log.codes.FIELD_UNSUPPORTED_TYPE, {
                  type: field.type,
                  field: field.path
                });
                field.type = null;
            }
          }
        }
      };

      return {
        setFieldType: setFieldType
      };
    }]);

})();
