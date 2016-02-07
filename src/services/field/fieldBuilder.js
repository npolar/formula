/* globals angular */
angular.module('formula').service('formulaFieldBuilder', ['formulaField', 'formulaInputField', 'formulaObjectField', 'formulaArrayField',
  function(Field, InputField, ObjectField, ArrayField) {
    "use strict";

    var isType = function (schemaType, type) {
      if (schemaType instanceof Array) {
        return schemaType.indexOf(type) !== -1;
      } else {
        return schemaType === type;
      }
    };

    var isEnum = function (schema) {
      return (schema.items && schema.items.enum);
    };

    return {
      build: function(options) {
        var schema = options.schema;
        Field.builder = this;
        if (typeof schema === 'object') {
          var field;
          if (isType(schema.type, 'object')) {
            field = ObjectField.create(options);
          } else if (isType(schema.type, 'array') && !isEnum(schema)) {
            field = ArrayField.create(options);
          } else {
            field = InputField.create(options);
          }
          return field;
        }
      }
    };
  }
]);
