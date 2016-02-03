/* globals angular,window,console */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')

/**
 * @factory form
 *
 * Service used to create HTML form handler class instances.
 *
 * @returns form class constructor
 */
.factory('formulaForm', ['$rootScope', 'formulaJsonLoader', 'formulaModel', 'formulaField', 'formulaI18n',
  'formulaEvaluateConditionsService', 'formulaTemplateService',
  function($rootScope, jsonLoader, Model, Field, i18n, formulaEvaluateConditionsService, templates) {
    function fieldsetFromSchema(schema, data) {
      if (schema && schema.type === 'object') {
        var fieldsets = [{
          fields: [],
          id: 'the-fieldset',
          mainType: 'fieldset'
        }];

        Object.keys(schema.properties).forEach(function(key) {
          var val = schema.properties[key];
          var newField = new Field(val, key);
          if (newField.type) {
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
            id: fs.title + i,
            mainType: 'fieldset'
          };
          fs.fields.forEach(function(f, j) {
            var key;
            if (typeof f === 'string') {
              key = f;
            } else {
              key = f.id;
            }
            var fieldSchema = schema.properties[key] || { id: key };
            var newField = new Field(fieldSchema, key, null, f);
            if (newField.type) {
              newField.setRequired(schema.required);
              newField.valueFromModel(data);
              fieldset.fields.push(newField);
            }
          });
          templates.initNode(fieldset);
          fieldsets.push(fieldset);
        });
        return fieldsets;
      }
      return null;
    };

    /**
     * @class form
     *
     * HTML form handler class.
     *
     * @param schema Mandatory JSON Schema object
     * @param data
     * @param formDefinition Optional form definition object
     */
    function Form(schema, data, formDefinition, keepFailing) {
      this.errors = null;
      this.i18n = i18n;

      this.schema = schema;
      this.formDefinition = formDefinition;
      this.title = null;
      this.valid = false;
      this.model = new Model(data);
      this.mainType = 'form';

      templates.initNode(this);
      formulaEvaluateConditionsService.keepFailing(!!keepFailing);

      if (formDefinition) {
        this.title = formDefinition.title;
        this.fieldsets = fieldsetFromDefinition(schema, formDefinition, this.model.data);
      } else {
        this.fieldsets = fieldsetFromSchema(schema, this.model.data);
      }

      this.onsave = function(model) {
        window.open("data:application/json," + JSON.stringify(model));
      };

      var self = this;
      this.destroyWatcher = $rootScope.$on('revalidate', function() {
        self.validate();
      });
      this.translate();
      this.validate(true, true);
    }

    var collectFields = function (field) {
      var fields = [];

      var recurseField = function (field) {
        fields.push.apply(fields, collectFields(field));
      };

      if (field.typeOf('array')) {
        field.fields.forEach(recurseField);
        field.values.forEach(recurseField);
      } else if (field.typeOf('object')) {
        field.fields.forEach(recurseField);
      }
      fields.push(field);

      return fields;
    };

    Form.prototype = {

      updateTemplates: function () {
        templates.initNode(this);
        this.fieldsets.forEach(templates.initNode);
        this.fields().forEach(templates.initNode);
      },

      updateTemplate: function (template) {
        templates.evalTemplate(this, template);
        this.fieldsets.forEach(function (fieldset) {
          templates.evalTemplate(fieldset, template);
        });
        this.fields().forEach(function (field) {
          templates.evalTemplate(field, template);
        });
      },

      fields: function () {
        var fields = [];
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            fields.push.apply(fields, collectFields(field));
          });
        });
        return fields;
      },

      destroy: function () {
        this.fields().forEach(function (field) {
          if (typeof field.destroyWatcher === 'function') {
            field.destroyWatcher();
          }
        });
        this.destroyWatcher();
      },

      /**
       * @method activate
       *
       * Function used to activate a specified fieldset.
       * Useful to hide inactive fieldsets when using a tabbed environment.
       *
       * @param fieldset An object or an index number representing the fieldset
       */
      activate: function(fieldset) {
        this.fieldsets.forEach(function(f, i) {
          if (typeof fieldset === 'object' || typeof fieldset === 'number') {
            if ((typeof fieldset === 'object') ? (f === fieldset) : (i === fieldset)) {
              f.active = true;
            } else {
              f.active = false;
            }
          }
        });
      },

      /**
       * @method toggleArrays
       *
       * Function used to collapse/expand all arrays in the form.
       */
      toggleArrays: function() {
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            field.values.forEach(function(value, index) {
              field.itemToggle(index);
            });
          });
        });
      },

      /**
       * @method save
       *
       * Function calling a provided callback function used to save the form.
       * This function automatically injects the current form model object as a parameter.
       * If the callback parameter is not set, the model is displayed in a new window.
       *
       * @param validate Prevent form validation if this parameter is set to false
       */
      save: function(validate) {
        this.ready = false;
        if ((validate !== false) && !this.validate(true)) {
          console.warn('Document not vaild', this.errors);
          throw this.errors;
        }

        if (typeof this.onsave === 'function') {
          return this.onsave(this.model.data);
        }
      },

      /**
       * @method translate
       *
       * Function used to translate the form to language set in i18n service.
       *
       */
      translate: function() {

        function fieldTranslate(field, parent) {
          var fieldTranslation = (parent && parent.fields ? (parent.fields[field.id] || null) : null);

          if (field.typeOf('array') || field.typeOf('object')) {
            angular.forEach(field.fields, function(field) {
              fieldTranslate(field, fieldTranslation);
            });

            angular.forEach(field.values, function(fieldset) {
              angular.forEach(fieldset.fields, function(field) {
                fieldTranslate(field, fieldTranslation);
              });
            });
          }

          if (fieldTranslation) {
            field.title = fieldTranslation.title || field.title;

            field.description = fieldTranslation.description || field.description;

            if (field.typeOf('select')) {
              field.values = [];

              angular.forEach(field.enum, function(key, index) {
                field.values.push({
                  id: key,
                  label: fieldTranslation.values ? (fieldTranslation.values[index] || key) : key
                });
              });
            }
          } else {
            if (field.typeOf('select')) {
              field.values = [];

              angular.forEach(field.enum, function(val) {
                field.values.push({
                  id: val,
                  label: val
                });
              });
            }
          }
        }

        this.fieldsets.forEach(function(fs, i) {
          if (i18n.fieldsets) {
            fs.title = i18n.fieldsets[i] || fs.title;
          }

          fs.fields.forEach(function(field) {
            fieldTranslate(field, i18n);
          });
        });
      },

      /**
       * @method validate
       *
       * Function used to validate all the fields within the form.
       * This function also populates the form errors member if the validation fails.
       *
       * @returns true if the entire form is valid, otherwise false
       */
      validate: function(force, silent) {
        var errors = this.errors || [];
        var fieldValidate = function(field) {
          if (field.typeOf('array')) {
            field.values.forEach(function(value) {
              fieldValidate(value);
            });
          } else if (field.typeOf('object')) {
            field.fields.forEach(function(subfield) {
              fieldValidate(subfield);
            });
          }

          if (field.dirty || force) {
            var index;
            if (field.validate(force, silent)) {
              if ((index = errors.indexOf(field.path)) !== -1) {
                errors.splice(index, 1);
              }
            } else if (field.typeOf('input')) { // Only show input errors
              errors.push(field.path);
              // Only unique
              errors = errors.filter(function(value, index, self) {
                return self.indexOf(value) === index;
              });
            }
          }


        };

        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            fieldValidate(field);

            if (field.valid) {
              this.model.data[field.id] = field.value;
            } else {
              delete this.model.data[field.id];
            }
          }, this);
        }, this);

        formulaEvaluateConditionsService.evaluateConditions(this);
        this.errors = errors;

        if ((this.valid = !(this.errors.length))) {
          this.errors = null;
        }
        return this.valid;
      }
    };

    return Form;
  }
]);

})();
