/* globals angular */
angular.module('formula').factory('formulaObjectField', ['formulaLog', 'formulaField', 'formulaTemplateService',
  function(log, formulaField, formulaTemplateService) {
    "use strict";

    var applyDefaultValue = function(field) {
      if (field.default !== undefined) {
        field.value = field.default;
      } else {
        field.value = {};
      }
    };

    var applyType = function(field) {
      field.mainType = '@object';
      if (!field.schema.properties) {
        log.warning(log.codes.FIELD_MISSING_PROPERTY, {
          property: 'properties',
          field: field.path
        });
        field.type = null;
      }
    };

    var ObjectField = {
      create: function(options) {
        var field = Object.create(formulaField.create(options));
        angular.extend(field, ObjectField.prototype);
        applyType(field);
        if (!field.type) {
          return;
        }
        applyDefaultValue(field);

        field.fieldAdd();

        formulaTemplateService.initNode(field);

        field.visible = field.hidden ? false : true;

        return field;
      }
    };

    var skipField = function(fieldDefinition) {
      return (typeof fieldDefinition === 'string' && fieldDefinition.charAt(0) === "!");
    };

    ObjectField.prototype = {

      /**
       * @method fieldAdd
       *
       * Function used to add subfields to object and array-typed field.
       *
       * @param schema JSON Schema defining the field being added
       * @returns true if the field was successfully added, otherwise false
       */

      fieldAdd: function() {
        var parents = this.parents.slice();
        parents.push(this);

        if (!this.fields) {
          this.fields = [];
        }

        Object.keys(this.schema.properties).forEach(function(key) {
          var schema = this.schema.properties[key];
          var fieldDefinition;
          if (this.fieldDefinition.fields) {
            this.fieldDefinition.fields.forEach(function(field) {
              var id;
              if (typeof field === 'string') {
                id = field.replace('!', '');
              } else {
                id = field.id;
              }
              if (key === id) {
                fieldDefinition = field;
              }
            });
          }
          if (!skipField(fieldDefinition)) {
            var newField = formulaField.builder.build({
              schema: schema,
              id: key,
              parents: parents,
              fieldDefinition: fieldDefinition
            });
            if (newField) {
              newField.setRequired(this.schema.required);
              this.fields.push(newField);
            }
          }

        }, this);
      },

      itemChange: function(item) {
        if (this.fields) {
          this.value = {};
          this.fields.forEach(function(field) {
            if (field.value !== undefined) {
              this.value[field.id] = field.value;
            }
          }, this);
        }
      },

      valueFromModel: function(model) {
        if (model[this.id] !== undefined) {
          this.fields.forEach(function(fc, index) {
            if (model[this.id][fc.id] !== undefined) {
              fc.valueFromModel(model[this.id]);
            }
          }, this);

          formulaField.prototype.valueFromModel.call(this, model);
        }
      },

      translate: function (translations) {
        if (translations) {
          if (translations.fields) {
            this.fields.forEach(function(field) {
              if (translations.fields[field.id]) {
                field.translate(translations.fields[field.id]);
              }
            });
          }

          formulaField.prototype.translate.call(this, translations);
        }
      },

    };

    return ObjectField;
  }
]);
