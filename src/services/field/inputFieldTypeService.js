/* globals angular,tv4 */
angular.module('formula').service('formulaInputFieldTypeService', ['$filter', 'formulaLog', 'formulaFormat',
  function($filter, log, format) {
    "use strict";

    var handleMultiEnum = function (field) {
      field.enum = field.schema.items.enum;
      field.multiple = true;
      if (field.schema.minItems >= 1) {
        field.required = true;
      }
    };

    var handleEnums = function (field) {
      field.values = [];
      field.enum.forEach(function(val) {
        field.values.push({
          id: val,
          label: val
        });
      });
    };

    var applyType = function(field) {
      field.mainType = '@field';
      var newType = 'input:text'; // default
      if (field.schema.items && field.schema.items.enum) { // enums as array in schema
        handleMultiEnum(field);
      }

      if (field.type === 'select' || field.enum) {
        newType = 'input:select';
        handleEnums(field);
      } else if (field.format) {
        var formatNoDash = field.format.replace('-', '');

        if (format[formatNoDash]) {
          tv4.addFormat(field.format, format[formatNoDash]);
          if (['date', 'datetime', 'time'].indexOf(formatNoDash) !== -1) {
            newType = 'input:' + formatNoDash;
          }
        } else {
          log.warning(log.codes.FIELD_UNSUPPORTED_FORMAT, {
            format: field.format,
            field: field.path
          });
        }
      } else {
        switch (field.type) {
          case 'any':
            newType = 'input:any';
            break;

          case 'boolean':
            newType = 'input:checkbox';
            field.value = !!field.value;
            break;

          case 'integer':
          case 'number':
            newType = 'input:number';
            break;

          case 'range':
            newType = 'input:range';
            break;

          case 'textarea':
            newType = 'input:textarea';
            break;

          case 'string':
          case 'text':
            newType = 'input:text';
            break;
          case undefined:
            newType = 'input:text';
            break;

          default:
            log.warning(log.codes.FIELD_UNSUPPORTED_TYPE, {
              type: field.type,
              field: field.path
            });
            newType = null;
        }
      }
      field.type = newType;
    };


    return {
      applyType: applyType
    };
  }
]);
