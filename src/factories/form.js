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
    function fieldsetFromSchema(form, schema) {
      if (schema && schema.type === 'object') {
        var fields = [];

        angular.forEach(schema.properties, function(val, key) {
          var newField = new Field(val, key);
          newField.required = newField.required || (schema.required && schema.required.indexOf(key) !== -1);
          newField.valueFromModel(model.data);

          fields.push(newField);
        });

        return fields;
      }

      return null;
    }

    /**
     * @class form
     *
     * HTML form handler class.
     *
     * @param uri Optional URI to form definition object
     */
    function Form(uri) {
      this.errors = null;
      this.fieldsets = null;
      this.i18n = i18n(null);
      this.schema = null;
      this.title = null;
      this.uri = uri || null;
      this.valid = false;

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
       * @method build
       *
       * Function used to build a HTML form based on a JSON Schema.
       *
       * @param schema Mandatory JSON Schema object
       * @param form Optional form definition object
       */
      build: function(schema, form) {
        if (typeof schema === 'object') {
          var baseForm = fieldsetFromSchema(this, schema);
          baseForm.fieldExtended = function(formField) {
            for (var i = 0; i < this.length; ++i) {
              var obj = (typeof formField === 'object');
              if (this[i].id === (obj ? formField.id : formField)) {
                if (obj) {
                  var ret = new Field(this[i]);
                  return ret.attrsSet(formField);
                }
                return new Field(this[i]);
              }
            }
            return null;
          };

          if (form && form.fieldsets) {
            this.title = form.title;
            this.fieldsets = [];

            angular.forEach(form.fieldsets, function(fs, i) {
              this.fieldsets.push({
                title: fs.title,
                active: (i ? false : true),
                fields: []
              });
              angular.forEach(fs.fields, function(f, j) {
                var field = baseForm.fieldExtended(f);
                if (field) {
                  this.fieldsets[i].fields.push(field);
                }
              }, this);
            }, this);
          } else {
            this.fieldsets = [{
              fields: baseForm,
              active: true
            }];
          }

          this.schema = schema;
        }
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
