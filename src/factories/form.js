"use strict";
/* globals angular */

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
.factory('formulaForm', ['formulaJsonLoader', 'formulaModel', 'formulaField', 'formulaI18n',
  function(jsonLoader, model, Field, i18n) {
    function fieldsetFromSchema(schema) {
      if (schema && schema.type === 'object') {
        var fieldsets = [{
          fields: []
        }];

        Object.keys(schema.properties).forEach(function(key) {
          var val = schema.properties[key];
          var newField = new Field(val, key);
          newField.valueFromModel(model.data);
          fieldsets[0].fields.push(newField);
        });

        return fieldsets;
      }

      return null;
    }

    var fieldsetFromDefinition = function (schema, formDefinition) {
      if (schema && schema.type === 'object' && formDefinition.fieldsets) {
        var fieldsets = [];

        formDefinition.fieldsets.forEach(function(fs, i) {
          var fieldset = {
            title: fs.title,
            active: (i ? false : true),
            fields: []
          };
          fs.fields.forEach(function(f, j) {
            var key;
            if (typeof f === 'string') {
              key = f;
            } else {
              key = f.id;
            }
            var parents = [{id: fs.title}];
            var newField = new Field(schema.properties[key], key, parents, f);
            newField.valueFromModel(model.data);
            fieldset.fields.push(newField);
          });
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
     * @param formDefinition Optional form definition object
     */
    function Form(schema, formDefinition) {
      this.errors = null;
      this.i18n = i18n(null);
      this.schema = schema;
      this.title = null;
      this.valid = false;

      if (formDefinition) {
        this.title = formDefinition.title;
        this.fieldsets = fieldsetFromDefinition(schema, formDefinition);
      } else {
        this.fieldsets = fieldsetFromSchema(schema);
      }

      this.onsave = function(model) {
        window.open("data:application/json," + JSON.stringify(model));
      };
    }

    Form.prototype = {

			updateValues: function () {
				this.fieldsets.forEach(function (fieldset) {
					fieldset.fields.forEach(function (field) {
						field.valueFromModel(model.data);
					});
				});
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
       * @param callback Function with one object parameter called if the form is valid
       * @param validate Prevent form validation if this parameter is set to false
       */
      save: function(callback, validate) {
        if ((validate !== false) && !this.validate(true)) {
          console.warn('Document not vaild', this.errors);
          throw this.errors;
        }

        if (typeof this.onsave === 'function') {
          this.onsave(model.data);
        }
      },

      /**
       * @method translate
       *
       * Function used to translate the form using a specific language.
       *
       * @param code ISO 639-3 code to language used for translation
       */
      translate: function(code) {
        function fieldTranslate(field, parent) {
          var fieldTranslation = (parent && parent.fields ? (parent.fields[field.id] || null) : null);

          if (field.type === 'array:fieldset' || field.type === 'object') {
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

            if (field.title === undefined) {
              field.title = field.id;
            }

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
            field.title = field.title;

            if (field.title === undefined) {
              field.title = field.id;
            }

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

        this.i18n = i18n(code);

        angular.forEach(this.fieldsets, function(fs, i) {
          if (this.i18n.fieldsets) {
            fs.title = this.i18n.fieldsets[i] || fs.title;
          }

          angular.forEach(fs.fields, function(field) {
            fieldTranslate(field, this.i18n);
          }, this);
        }, this);
      },

      /**
       * @method validate
       *
       * Function used to validate all the fields within the form.
       * This function also populates the form errors member if the validation fails.
       *
       * @returns true if the entire form is valid, otherwise false
       */
      validate: function(force) {
        var errors = [];

				var fieldValidate = function (field) {
					if (field.typeOf('array')) {
						field.values.forEach(function(value) {
							fieldValidate(value);
						});
					} else if (field.typeOf('object')) {
						field.fields.forEach(function(subfield) {
							fieldValidate(subfield);
						});
					} else {
						if (field.dirty || force) {
              if (field.validate(force)) {
                model.data[field.id] = field.value;
              } else {
                errors.push(field.path + ' (' + field.error + ')');
                delete model.data[field.id];
              }
            }
					}
				};

        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            fieldValidate(field);
          });
        });
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
