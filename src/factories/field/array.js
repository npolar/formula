/* globals angular */
angular.module('formula').factory('formulaArrayField', ['$rootScope', 'formulaField', 'formulaArrayFieldTypeService', 'formulaTemplateService',
  function($rootScope, formulaField, formulaArrayFieldTypeService, formulaTemplateService) {
    "use strict";

    var applyDefaultValue = function(field) {
      if (field.default !== undefined) {
        // Ensure array typed default if required
        if (!(field.default instanceof Array)) {
          field.default = [field.default];
        }
        field.value = field.default;
      } else {
        field.value = [];
      }
    };

    var ArrayField = {
      create: function(options) {
        var field = Object.create(formulaField.create(options));
        angular.extend(field, ArrayField.prototype);
        formulaArrayFieldTypeService.applyType(field);
        if (!field.type) {
          return;
        }
        applyDefaultValue(field);

        field.fieldAdd();

        // Add one element to arrays which requires at least one element
        if (field.typeOf('array') && field.schema.minItems) {
          field.itemAdd();
        }

        formulaTemplateService.initNode(field);
        field.sortable = {
          onEnd: function (e) {
            field.values = e.models;
            field.recalcIndex();
          }
        };
        field.visible = field.hidden ? false : true;

        return field;
      },
    };

    var countHidden = function(memo, value) {
      return memo + (value.hidden ? 0 : 1);
    };

    ArrayField.prototype = {

      /**
       * @method fieldAdd
       *
       * Function used to add subfields to object and array-typed field.
       *
       * @param schema JSON Schema defining the field being added
       * @returns true if the field was successfully added, otherwise false
       */
      fieldAdd: function() {
        var newField;
        var parents = this.parents.slice();
        parents.push(this);

        if (!this.fields) {
          this.fields = [];
        }

        var id = /\/([^\/]*?)$/.exec(this.path)[1] + '_item';
        var fieldDefinition = {
          id: id
        };
        fieldDefinition.fields = this.fieldDefinition.fields || null;
        var schema = this.schema.items;
        newField = formulaField.builder.build({
          schema: schema,
          id: id,
          parents: parents,
          fieldDefinition: fieldDefinition
        });
        if (newField) {
          newField.setRequired(this.schema.required);
          newField.index = this.fields.length;
          this.fields.push(newField);
        }
      },

      /**
       * @method itemAdd
       *
       * Function used to add a copy of the subfields for validating.
       * The values of each fieldset are automatically monitored.
       *
       * @param preventValidation bool
       * @returns Reference to the item just added
       */
      itemAdd: function(preventValidation) {
        if (this.fields) {
          var parents = this.parents.slice();
          parents.push(this);

          var index = this.values.length;
          var proto = this.fields[0];
          var field = formulaField.builder.build({
            schema: proto.schema,
            id: proto.id,
            parents: parents,
            fieldDefinition: proto.fieldDefinition,
            index: index
          });
          if (!field.type) {
            return null;
          }
          this.values.push(field);

          if (field.value !== undefined) {
            this.value.push(field.value);
          }
          this.dirty = true;
          this.dirtyParents();
          if (preventValidation !== true) {
            $rootScope.$emit('revalidate');
          }
          return field;
        }

        return null;
      },

      /**
       * @method itemRemove
       *
       * Function used to remove a fieldset from an array-typed field.
       *
       * @param item Index number of the fieldset which should be removed
       */
      itemRemove: function(item) {
        if (this.values.length > item) {
          this.values.splice(item, 1);
          this.value.splice(item, 1);
        }

        if (typeof item.destroyWatcher === 'function') {
          item.destroyWatcher();
        }

        this.dirty = true;
        this.dirtyParents();
        $rootScope.$emit('revalidate');
      },

      recalcIndex: function() {
        this.values.forEach(function(fs, i) {
          fs.index = i;
        });
      },

      itemChange: function(item) {
        if (this.values) {
          this.value = [];
          this.values.forEach(function(field) {
            if (field.value !== undefined) {
              this.value.push(field.value);
            }
          }, this);
        }
      },

      /**
       * @method itemToggle
       *
       * Function used to toggle visibility of a fieldset item.
       *
       * @param item Index number of the fieldset which should be toggled
       */
      itemToggle: function(item) {
        if (this.values.length > item) {
          this.values[item].visible = !this.values[item].visible;
        }
      },

      valueFromModel: function(model) {
        if (model[this.id] !== undefined) {
          this.values = [];
          model[this.id].forEach(function(item, index) {
            var newField;
            if (this.typeOf('fieldset')) {
              newField = this.itemAdd(true /* preventValidation */ );
              if (newField.index !== 0) {
                newField.visible = false;
              }
              if (newField) {
                var valueModel = {};
                valueModel[this.values[index].id] = item;
                this.values[index].valueFromModel(valueModel);
              }
            } else if (this.typeOf('field')) {
              newField = this.itemAdd(true /* preventValidation */ );
              if (newField) {
                this.values[index].value = item;
              }
            } else {
              // @TODO Support array:array
              // jshint -W035
            }
          }, this);

          formulaField.prototype.valueFromModel.call(this, model);
        }
      },

      nrArrayValues: function() {
        if (this.values) {
          return this.values.reduce(countHidden, 0);
        }
        return 0;
      }
    };

    return ArrayField;
  }
]);
