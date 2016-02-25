/* globals angular */
angular.module('formula').factory('formulaArrayField', ['$rootScope', 'formulaField', 'formulaI18n', 'formulaArrayFieldTypeService', 'formulaTemplateService',
  function($rootScope, formulaField, i18n, formulaArrayFieldTypeService, formulaTemplateService) {
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

    var recalcIndex = function(field) {
      field.values.forEach(function(fs, i) {
        fs.index = i;
      });
    };

    var ArrayField = {
      create: function(options) {
        var field = formulaField.create(options);
        angular.extend(field, ArrayField.prototype);
        formulaArrayFieldTypeService.applyType(field);
        if (!field.type) {
          return;
        }
        applyDefaultValue(field);

        field.setItemProto();

        // Add one element to arrays which requires at least one element
        if (field.schema.minItems) {
          field.itemAdd();
        }

        formulaTemplateService.initNode(field);

        field.sortable = {
          onEnd: function (e) {
            field.values = e.models;
            recalcIndex(field);
            field.itemChange();
          },
          handle: '.drag-handle'
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
       * @method setItemProto
       *
       * Sets array item prototype
       *
       * @returns true if the field was successfully added, otherwise false
       */
      setItemProto: function() {
        var newField;
        var parents = this.parents.slice();
        parents.push(this);

        if (!this.items) {
          this.items = [];
        }

        var id = /\/([^\/]*?)$/.exec(this.path)[1] + '_item';
        var fieldDefinition = this.fieldDefinition.items || {};
        fieldDefinition.id = id;
        var schema = this.schema.items;
        newField = formulaField.builder.build({
          schema: schema,
          id: id,
          parents: parents,
          fieldDefinition: fieldDefinition
        });
        if (newField) {
          newField.setRequired(this.schema.required);
          newField.index = this.items.length;
          this.items.push(newField);
          return true;
        }
        return false;
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
        if (this.items) {
          var parents = this.parents.slice();
          parents.push(this);

          var index = this.values.length;
          var proto = this.items[0];
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
          if (this.fieldTranslations) {
            field.translate(this.fieldTranslations);
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
       * @return removed item
       */
      itemRemove: function(item) {
        var removed;
        if (this.values.length > item) {
          removed = this.values.splice(item, 1)[0];
          this.value.splice(item, 1);
        }

        recalcIndex(this);

        if (typeof item.destroyWatcher === 'function') {
          item.destroyWatcher();
        }

        this.dirty = true;
        this.dirtyParents();
        $rootScope.$emit('revalidate');
        return removed;
      },

      moveUp: function (index) {
        var a = this.values[index];
        var b = this.values[index - 1];
        a.index = index - 1;
        b.index = index;
        this.values[index - 1] = a;
        this.values[index] = b;
      },

      moveDown: function (index) {
        var a = this.values[index];
        var b = this.values[index + 1];
        a.index = index + 1;
        b.index = index;
        this.values[index + 1] = a;
        this.values[index] = b;
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
              if (newField.index !== 0) { // @FIXME does not handle hidden array items
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
            }
          }, this);

          formulaField.prototype.valueFromModel.call(this, model);
        }

      },

      translate: function (translations) {
        if (translations) {
          this.fieldTranslations = translations.fields;
          Object.keys(translations.fields || {}).forEach(function (key, index) {
            this.items.concat(this.values).forEach(function(field) {
              field.translate(translations.fields);
            }, this);
          }, this);
          formulaField.prototype.translate.call(this, translations);
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
