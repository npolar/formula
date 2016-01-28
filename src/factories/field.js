/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 *
 */
angular.module('formula')

/**
 * @factory field
 *
 * Service used to create HTML form field handler class instances.
 *
 * @returns field class constructor
 */

.factory('formulaField', ['$filter', '$rootScope', 'formulaLog', 'formulaFormat',
        'formulaFieldAttributesService', 'formulaFieldValidateService',
        'formulaFieldValueFromModelService',
  function($filter, $rootScope, log, format, formulaFieldAttributesService,
    formulaFieldValidateService, formulaFieldValueFromModelService) {
    /**
     * @class field
     *
     * HTML form field handler class.
     * If the second (id) parameter is specified, the field will be recognized as a schema field.
     * Schema fields are fields generated from JSON Schemas, and does not inherit overloaded data.
     *
     * @param data A mandatory object containing default data values
     * @param id An optional string representing the unique field ID
     * @param parents An optional array of the field parents
     */

    function Field(schema, id, parents, fieldDefinition) {
      if (typeof schema === 'object') {

        formulaFieldAttributesService.attrsSet(this, {
          schema: schema,
          id: id,
          parents: parents,
          fieldDefinition: fieldDefinition
        });
      }
      return this;
    }

    var skipField = function(fieldDefinition) {
      return (typeof fieldDefinition === 'string' && fieldDefinition.charAt(0) === "!");
    };

    var countHidden = function(memo, value) {
      return memo + (value.hidden ? 0 : 1);
    };

    Field.uids = [];

    Field.prototype = {
      dirtyParents: function () {
        for (var i = this.parents.length-1; i>=0; i--) {
          this.parents[i].dirty = true;
          this.parents[i].itemChange(this);
        }
      },

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

        if (this.typeOf('array')) {
          var id = /\/([^\/]*?)$/.exec(this.path)[1] + '_' + (this.schema.items.type || 'any');
          var fieldDefinition = { id: id };
          fieldDefinition.fields = this.fieldDefinition.fields || null;
          var schema = this.schema.items;
          newField = new Field(schema, id, parents, fieldDefinition);
          // Only a prototype for array values, don't need watcher
          if (typeof newField.destroyWatcher === 'function') {
            newField.destroyWatcher();
          }
          if (newField.type) {
            newField.setRequired(this.schema.required);
            newField.index = this.fields.length;
            this.fields.push(newField);
          }

        } else if (this.typeOf('object')) {
          Object.keys(this.schema.properties).forEach(function(key) {
            var schema = this.schema.properties[key];
            var fieldDefinition;
            if (this.fieldDefinition.fields) {
              this.fieldDefinition.fields.forEach(function(field) {
                var id;
                if (typeof field === 'string') {
                  id = field.replace('!','');
                } else {
                  id = field.id;
                }
                if (key === id) {
                  fieldDefinition = field;
                }
              });
            }
            if (!skipField(fieldDefinition)) {
              var newField = new Field(schema, key, parents, fieldDefinition);
              if (newField.type) {
                newField.setRequired(this.schema.required);
                this.fields.push(newField);
              }
            }

          }, this);
        }
      },

      /**
       * @method fieldFromID
       *
       * Function used to get a subfield from specified ID.
       *
       * @param id ID used for subfield look-up
       * @returns The subfield which matches the specified ID, otherwise null
       */

      fieldFromID: function(id) {
        var fieldMatch = null;

        angular.forEach(this.fields, function(field) {
          if (!fieldMatch && field.id === id) {
            fieldMatch = field;
          }
        });

        return fieldMatch;
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
        if (this.typeOf('array') && this.fields) {
          var parents = this.parents.slice(),
            index;
          parents.push(this);

          var proto = this.fields[0];
          var field = new Field(proto.schema, proto.id, parents, proto.fieldDefinition);
          if (!field.type) {
            return null;
          }
          index = this.values.push(field) - 1;
          field.index = index;

          if (proto.customTemplate && !field.customTemplate) {
            field.customTemplate = proto.customTemplate;
          }

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
       * @method itemIndex
       *
       * Function used to return the fieldset index of a subfield based on ID.
       *
       * @param id Field ID of the subfield as a string
       */
      itemIndex: function(id) {
        for (var index in this.fields) {
          if (this.fields[index].id === id) {
            return index;
          }
        }
        return -1;
      },

      /**
       * @method itemRemove
       *
       * Function used to remove a fieldset from an array-typed field.
       *
       * @param item Index number of the fieldset which should be removed
       */
      itemRemove: function(item) {
        if (this.typeOf('array')) {
          if (this.values.length > item) {
            this.values.splice(item, 1);
            this.value.splice(item, 1);
          }

          this.values.forEach(function(fs, i) {
            fs.index = i;
          }, this);

          if (typeof item.destroyWatcher === 'function') {
            item.destroyWatcher();
          }

          this.dirty = true;
          this.dirtyParents();
          $rootScope.$emit('revalidate');
        }
      },

      itemChange: function(item) {
        switch (this.type) {
          case 'array:fieldset':
          case 'array:field':
            if (this.values) {
              this.value = [];
              this.values.forEach(function (field) {
                if (field.value !== undefined) {
                  this.value.push(field.value);
                }
              }, this);
            }
            break;
          case 'object':
            if (this.fields) {
              this.value = {};
              this.fields.forEach(function(field) {
                if (field.value !== undefined) {
                  this.value[field.id] = field.value;
                }
              }, this);
            }
            break;
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
        if (this.typeOf('array')) {
          if (this.values.length > item) {
            this.values[item].visible = !this.values[item].visible;
          }
        }
      },

      /**
       * @method pathGen
       *
       * Function used to generate full JSON path for fields
       */
      get path() {
        var path = '#';

        // jshint -W116
        var genFieldPath = function (field) {
          var path = '/';

          // (null || undefined)
          if (field.index != null) {
            path += field.index;
          } else {
            path += field.id;
          }
          return path;
        };

        this.parents.forEach(function(parent) {
          path += genFieldPath(parent);
        });

        path += genFieldPath(this);
        return path;
      },

      /**
       * @method typeOf
       *
       * Function used to check if field in a specific type.
       *
       * @param type Type to check
       * @returns true if field type matches with specified type, otherwise false
       */
      typeOf: function(type) {
        if (!(this.type && typeof this.type === 'string')) {
          return false;
        }
        var types;
        return (type === this.type || type === (types = this.type.split(':'))[0] || type === types[1]);
      },

      /**
       * @method uidGen
       *
       * Function used to generate a new Unique field ID.
       *
       * @param len Optional number parameter to specify the UID-length
       * @returns The newly generated UID
       */
      uidGen: function(len) {
        var uid = 'formula-',
          chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for (var i = 0; i < (len ? len : 8); ++i) {
          uid += chars[Math.floor(Math.random() * chars.length)];
        }

        if (Field.uids.indexOf(uid) !== -1) {
          return this.uidGen(len);
        } else {
          this.uid = uid;
        }

        return uid;
      },
      isEmpty: function() {
        // intentional == (null || undefined)
        // jshint -W116
        return (this.value == null || this.value.length === 0);
      },
      /**
       * @method validate
       *
       * Function used to validate the field based on its schema.
       * This function also sets the field error memeber value if the validation fails,
       * and additionally sets the form valid state if a parent form is specified.
       *
       * @returns true if the field is valid, otherwise false
       */
      validate: function(force, silent) {
        return formulaFieldValidateService.validate(this, {
          force: force,
          silent: silent
        });
      },

      /**
       * @method valueFromModel
       *
       * Function used to set field value based on model object.
       *
       * @param model
       */

      valueFromModel: function(model) {
        formulaFieldValueFromModelService.valueFromModel(this, model);
      },

      nrArrayValues: function() {
        if (this.values) {
          return this.values.reduce(countHidden, 0);
        }
        return 0;
      },

      setRequired: function(required) {
        this.required = (required === true) || (required instanceof Array && required.indexOf(this.id) !== -1);
      }
    };

    return Field;
  }
]);

})();
