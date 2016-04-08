/* globals angular,window,console */
angular.module('formula').factory('formulaForm', ['$rootScope', '$location', 'formulaJsonLoader', 'formulaModel', 'formulaI18n',
  'formulaEvaluateConditionsService', 'formulaTemplateService', 'formulaFieldset', 'formulaDirtyCheckService',
  function($rootScope, $location, jsonLoader, Model, i18n, formulaEvaluateConditionsService, templates, formulaFieldset, dirtyCheckService) {
    "use strict";

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

      this.schema = schema;
      this.formDefinition = formDefinition;
      this.title = null;
      this.valid = false;
      this.model = new Model(data);
      this.mainType = '@form';

      templates.initNode(this);
      formulaEvaluateConditionsService.setKeepFailing(!!keepFailing);

      var defaultLang = 'en';
      if (formDefinition) {
        this.title = formDefinition.title;
        this.fieldsets = formulaFieldset.fieldsetFromDefinition(schema, formDefinition, this.model.data);
        defaultLang = formDefinition.lang || defaultLang;
      } else {
        this.fieldsets = formulaFieldset.fieldsetFromSchema(schema, this.model.data);
      }

      this.onsave = function(model) {
        window.open("data:application/json," + JSON.stringify(model));
        this.ready = true;
      };

      var self = this;
      this.destroyWatcher = $rootScope.$on('revalidate', function() {
        self.validate();
      });
      this.destoryDirtyChecker = $rootScope.$on('$locationChangeStart', function(event, next, prev) {
        if (dirtyCheckService.isDirty() && self.confirmDirtyNavigate) {
          event.preventDefault();
          self.confirmDirtyNavigate(function () {
            dirtyCheckService.override();
            var baseTag = document.head.querySelector('base'), base;
            base = baseTag ? baseTag.href.replace(/\/$/, '') : location.protocol + '//' + location.host;
            $location.path(next.replace(base, ''));
          });
        }
      });

      i18n.addDefaultLanguage(this, defaultLang).then(function () {
        self.translate();
      });
      this.activate = this.activate.bind(this);
      this.validate(true, true);
    }

    var collectFields = function(field) {
      var fields = [];

      var recurseField = function(field) {
        fields.push.apply(fields, collectFields(field));
      };

      if (field.typeOf('array')) {
        field.items.forEach(recurseField);
        field.values.forEach(recurseField);
      } else if (field.typeOf('object')) {
        field.fields.forEach(recurseField);
      }
      fields.push(field);

      return fields;
    };

    Form.prototype = {

      updateTemplates: function() {
        templates.initNode(this);
        this.fieldsets.forEach(templates.initNode);
        this.fields().forEach(templates.initNode);
      },

      updateTemplate: function(template) {
        templates.evalTemplate(this, template);
        this.fieldsets.forEach(function(fieldset) {
          templates.evalTemplate(fieldset, template);
        });
        this.fields().forEach(function(field) {
          templates.evalTemplate(field, template);
        });
      },

      fields: function() {
        var fields = [];
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            fields.push.apply(fields, collectFields(field));
          });
        });
        return fields;
      },

      destroy: function() {
        this.fields().forEach(function(field) {
          field.destroy();
        });
        this.destroyWatcher();
        this.destoryDirtyChecker();
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
        if (!this.fieldsets) {
          return; // might be called before form is ready
        }
        var fs;
        this.fieldsets.forEach(function(f, i) {
          if (typeof fieldset === 'object' || typeof fieldset === 'number') {
            if ((typeof fieldset === 'object') ? (f === fieldset) : (i === fieldset)) {
              f.active = true;
              fs = f;
            } else {
              f.active = false;
            }
          }
        });
        $rootScope.$broadcast('activate:fieldset', fs);
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
        if ((validate !== false) && !this.validate(true)) {
          console.warn('Document not vaild', this.errors);
          throw this.errors;
        }

        if (typeof this.onsave === 'function') {
          this.ready = false;
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
        this.fieldsets.forEach(function(fs, i) {
          if (i18n.fieldsets) {
            fs.title = i18n.fieldsets[i] || fs.title;
          }
          if (i18n.fields) {
            fs.fields.forEach(function(field) {
              if (i18n.fields[field.id]) {
                field.translate(i18n.fields[field.id]);
              }
            });
          }
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
        var form = this;
        this.errors = [];
        var fieldValidate = function(field, fieldset) {
          var valid = true;
          if (field.typeOf('array')) {
            field.values.forEach(function(value) {
              fieldValidate(value, fieldset);
            });
          } else if (field.typeOf('object')) {
            field.fields.forEach(function(subfield) {
              fieldValidate(subfield, fieldset);
            });
          }

          // jshint -W041,-W116
          if ((field.dirty || force) && field.instance == null) {
            if (field.validate(force, silent)) {
              delete fieldset.errors[field.id];
            } else {
              if (field.typeOf('input') && !silent) {
                fieldset.errors[field.id] = field.error;
              }
              valid = false;
            }
          }
          return valid;
        };

        this.valid = true;
        this.fieldsets.forEach(function(fieldset) {
          fieldset.valid = true;
          fieldset.errors = fieldset.errors || {};
          fieldset.fields.forEach(function(field) {
            if (fieldValidate(field, fieldset)) {
              form.model.data[field.id] = field.value;
            } else {
              fieldset.valid = silent || (field.valid === false ? false : fieldset.valid);
              form.valid = false;
              delete form.model.data[field.id];
            }
          });
          form.errors = form.errors.concat(Object.keys(fieldset.errors).map(function (key) {
            return key + ': ' + fieldset.errors[key];
          }));
        });

        formulaEvaluateConditionsService.evaluateConditions(this);

        if (this.valid) {
          this.errors = null;
        }
        return this.valid;
      }
    };

    return Form;
  }
]);
