/* globals angular */
angular.module('formula').factory('formulaFieldset', ['formulaFieldBuilder', 'formulaTemplateService',
  function(fieldBuiler, templates) {
    "use strict";


    function fieldsetFromSchema(schema, data) {
      if (schema && schema.type === 'object') {
        var fieldsets = [{
          fields: [],
          active: true,
          id: 'the-fieldset',
          mainType: '@fieldset',
          valid: true
        }];

        Object.keys(schema.properties).forEach(function(key) {
          var val = schema.properties[key];
          var newField = fieldBuiler.build({
            schema: val,
            id: key
          });
          if (newField) {
            newField.setRequired(schema.required);
            newField.valueFromModel(data);
            fieldsets[0].fields.push(newField);
          }
        });
        templates.initNode(fieldsets[0]);
        return fieldsets;
      }

      return null;
    }

    var fieldsetFromDefinition = function(schema, formDefinition, data) {
      if (schema && schema.type === 'object' && formDefinition.fieldsets) {
        var fieldsets = [];

        formDefinition.fieldsets.forEach(function(fs, i) {
          var fieldset = {
            title: fs.title,
            active: (i ? false : true),
            fields: [],
            id: 'fs' + i,
            mainType: '@fieldset',
            valid: true
          };
          fieldsets.push(fieldset);
          fs.fields.forEach(function(f, j) {
            var key = (typeof f === 'string') ? f : f.id;
            var fieldSchema = schema.properties[key] || {
              id: key
            };
            var duplicate = fieldsets.reduce(function (memo, fieldset) {
              return memo.concat(fieldset.fields);
            }, []).find(function (field) {
              return field.id === key;
            });
            var newField = fieldBuiler.build({
              schema: fieldSchema,
              id: key,
              fieldDefinition: f
            });

            if (duplicate) {
              newField.value = duplicate.value;
              if (duplicate.values) {
                newField.values = duplicate.values;
              }
              if (duplicate.fields) {
                newField.fields = duplicate.fields;
              }
            }

            if (newField) {
              newField.setRequired(schema.required);
              newField.valueFromModel(data);
              fieldset.fields.push(newField);
            }
          });
          templates.initNode(fieldset);
        });
        return fieldsets;
      }
      return null;
    };

    return {
      fieldsetFromSchema: fieldsetFromSchema,
      fieldsetFromDefinition: fieldsetFromDefinition
    };
  }
]);
