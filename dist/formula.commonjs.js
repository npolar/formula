var angular = require("angular");var tv4 = require("tv4");module.exports = /* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula', []);

})();

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

.factory('formulaField', ['$filter', '$rootScope', 'formulaFormat',
        'formulaFieldAttributesService', 'formulaFieldValidateService',
        'formulaFieldValueFromModelService',
  function($filter, $rootScope, format, formulaFieldAttributesService,
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
    function Form(schema, data, formDefinition) {
      this.errors = null;
      this.i18n = i18n(null);
      this.schema = schema;
      this.formDefinition = formDefinition;
      this.title = null;
      this.valid = false;
      this.model = new Model(data);
      this.mainType = 'form';

      templates.initNode(this);

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
       * @param callback Function with one object parameter called if the form is valid
       * @param validate Prevent form validation if this parameter is set to false
       */
      save: function(callback, validate) {
        if ((validate !== false) && !this.validate(true)) {
          console.warn('Document not vaild', this.errors);
          throw this.errors;
        }

        if (typeof this.onsave === 'function') {
          this.onsave(this.model.data);
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

/* globals angular */

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
	 * @factory format
	 *
	 * Service used for generating JSON Schema format validation functions.
	 *
	 * @returns object with supported format properties as tv4 addFormat functions
	 */

	.factory('formulaFormat',
	[function() {
		return {
			color: // CSS 2.1 color
			function(data, schema) {
				var colors = "aqua,black,blue,fuchsia,gray,green,lime,maroon,navy,olive,orange,purple,red,silver,teal,white,yellow";

				if(typeof data === 'string') {
					// TODO: rgb-colors restricted to values between 0 and 255 (inclusive)
					if(colors.split(',').indexOf(data.toLowerCase()) !== -1 || /^(#([a-f0-9]{3}|[a-f0-9]{6})|rgb\(\s?\d{1,3}%?,\s?\d{1,3}%?,\s?\d{1,3}%?\s?\))$/i.test(data)) {
						return null;
					}

				}

				return 'CSS 2.1 color';
			},
			date:  // ISO 8601 date
			function(data, schema) {
				if(typeof data === 'string' && /^\d{4}(-\d{2}){2}$/.test(data)) {
					return null;
				}

				return 'ISO 8601 date, e.g. 2015-11-30 (year-month-day)';
			},
			datetime: // ISO 8601 datetime combination
			function(data, schema) {
				if(typeof data === 'string' && /^\d{4}(-\d{2}){2}T\d{2}(:\d{2}){2}(.\d+)?(([+-](\d{2}|\d{4}|\d{2}:\d{2}))|Z)$/.test(data)) {
					return null;
				}

				return 'ISO 8601 datetime, e.g. 2015-11-30T23:45:30Z';
			},
			yearmonth: // ISO 8601 date (without day)
			function(data, schema) {
				if(typeof data === 'string' && /^\d{4}-\d{2}$/.test(data)) {
					return null;
				}

				return 'ISO 8601 date without day fraction, e.g. 2016-01 (year-month)';
			},
			year: // ISO 8601 four-digit year
			function(data, schema) {
				if(typeof data === 'string' && /^\d{4}$/.test(data)) {
					return null;
				}

				return 'ISO 8601 four-digit year, e.g. 2015';
			},
			email: // RCF 3696 email
			function(data, schema) {
				var local = /^[-+a-z0-9!#$%&'*=?^_`{|}~\/]([-+a-z0-9!#$%&'*=?^_`{|}~\/]|\.(?!\.)){0,62}[-+a-z0-9!#$%&'*=?^_`{|}~\/]$/i,
					domain = /^[-a-z0-9]([-a-z0-9]|\.(?!\.)){0,253}[-a-z0-9]$/i, // TODO: IPv4 and IPv6 support
					comment = /\(.*\)/g,
					parts = (typeof data === 'string' ? data.split('@') : []);

				if(parts.length === 2 && data.length <= 254) {
					if(local.test(parts[0].replace(comment, '')) && domain.test(parts[1].replace(comment, ''))) {
						return null;
					}
				}

				return 'RCF 3696 e-mail address';
			},
			time: // ISO 8601 time
			function(data, schema) {
				if(typeof data === 'string' && /^\d{2}(:\d{2}){2}$/.test(data)) {
					return null;
				}

				return 'ISO 8601 time, e.g. 23:45:30';
			},
			uri: // RFC 3986 URI
			function(data, schema) {
				if(typeof data === 'string' && /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i.test(data)) {
					return null;
				}

				return 'RFC 3986 URI';
			}
		};
	}]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula').factory('formula',
	['$q', 'formulaTemplateService', 'formulaSchema', 'formulaJsonLoader', 'formulaForm', function($q, templates, Schema, jsonLoader, Form) {



		return function Formula(options) {
			console.log('new formula');
			if(!options) {
				throw "No formula options provided!";
			}

			var _cfg = {};
			var schema = new Schema();
			_cfg.language = options.language;

			if (options.templates instanceof Array) {
				templates.setTemplates(templates);
			}

			this.setLanguage = function (uri) {
				_cfg.language = uri;
				if (_cfg.controller) {
					_cfg.controller.setLanguage(uri);
				}
			};

			this.setModel = function (model) {
				formLoaded.then(function (responses) {
					createForm(model, responses[2]);
				});
			};

			this.setForm = function (form) {
				var asyncs = [formLoaded];
				if (typeof form === 'string') {
					asyncs.push(jsonLoader(form));
				} else {
					asyncs.push(Promise.resolve(form));
				}
				$q.all(asyncs).then(function (responses) {
					createForm(responses[0][1], responses[1]);
				});
			};

			this.setTemplates = function (templates) {
				templates.setTemplates(templates);
				if (_cfg.controller) {
					_cfg.controller.updateTemplates();
				}
			};

			this.addTemplate = function (template) {
				templates.addTemplate(template);
				if (_cfg.controller) {
					_cfg.controller.updateTemplates();
				}
			};

			this.setOnSave = function (onsave) {
				_cfg.form.onsave = onsave;
			};

			this.setSchema = function (schema) {
				schema = new Schema();
				formLoaded.then(function (responses) {
					createForm(responses[1], responses[2]);
				});
			};

			var asyncs = [schema.deref(options.schema), Promise.resolve(options.model)];

			if (options.form) {
				if (typeof options.form === 'string') {
					asyncs.push(jsonLoader(options.form));
				} else {
					asyncs.push(Promise.resolve(options.form));
				}
			}

			var createForm = function (model, formDefinition) {
				console.log('create form');
				if (_cfg.form) {
					_cfg.form.destroy();
				}
				_cfg.form = new Form(schema.json, model, formDefinition);
				if (_cfg.controller) {
					_cfg.controller.setForm(_cfg.form);
					_cfg.controller.setLanguage(_cfg.language);
				}
				_cfg.form.onsave = options.onsave || _cfg.form.onsave;
			};

			var formLoaded = $q.all(asyncs).then(function(responses) {
				console.log('form loaded');
				createForm(responses[1], responses[2]);
				return responses;
			}, function () {
				console.error('Could not load form', arguments);
			});

			this._cfg = _cfg;
    };
	}]);

})();

/* globals angular */

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
	 * @factory i18n
	 *
	 * Service used for handling Internationalization and Localization.
	 * This service is based on the ISO 639-3 standard for language codes.
	 *
	 * @returns A singleton for i18n handling
	 */

	.factory('formulaI18n',
	['formulaJsonLoader', 'formulaLog', '$q',
	function(jsonLoader, log, $q) {
		function i18n(code) {
			if(code && i18n.cache[code]) {
				return i18n.cache[code];
			}

			// Fallback translation
			return {
				add: 		[ 'Add', 'Click to add a new item' ],
				invalid: 	'{count} invalid fields',
				maximize: 	[ 'Maximize', 'Click to maximize item' ],
				minimize:	[ 'Minimize', 'Click to minimize item' ],
				remove:		[ 'Remove', 'Click to remove item' ],
				required:	'Required field',
				save:		[ 'Save', 'Click to save document' ],
				validate:	[ 'Validate', 'Click to validate form' ],

				code: null,
				fields: {},
				fieldsets: [],
				uri: null
			};
		}

		i18n.cache = {};

		/**
		 * @method add
		 *
		 * Function used to add a new translation from JSON URI.
		 *
		 * @param uri URI to JSON containing translation
		 * @returns $q promise object resolving to ISO 639-3 code
		 */

		i18n.add = function(uri) {
			var deferred = $q.defer();

			if(uri) {
				jsonLoader(uri).then(function(data) {
					var code = data['iso639-3'];

					if(code) {
						i18n.cache[code] = {
							code: code,
							fields: data.fields,
							fieldsets: data.fieldsets,
							uri: uri
						};

						angular.forEach(data.labels, function(val, key) {
							i18n.cache[code][key] = val;
						});

						deferred.resolve(code);
					} else {
						log.warning(log.codes.I18N_MISSING_CODE, { uri: uri });
					}
				});
			} else {
				deferred.reject('not a valid translation JSON URI: ' + uri);
			}

			return deferred.promise;
		};

		/**
		 * @method code
		 *
		 * Function used to get ISO 639-3 code for a added language from URI.
		 * This function can also be used to simply check if a language is added.
		 *
		 * @param uri URI used for language code look-up
		 * @returns ISO 639-3 code for the language if added, otherwise null
		 */

		i18n.code = function(uri) {
			var retCode = null;

			angular.forEach(i18n.cache, function(data, code) {
				if(!retCode && data.uri === uri) {
					retCode = code;
				}
			});

			return retCode;
		};

		return i18n;
	}]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2015, http://npolar.no/
 */

angular.module('formula')

	/**
	 * @factory jsonLoader
	 *
	 * Service used for asynchronous loading of JSON files.
	 *
	 * @param uri JSON file uri as a string
	 * @returns $q promise object to requested JSON file
	 */

	.factory('formulaJsonLoader',
	['$http', '$q', 'formulaLog',
	function($http, $q, log) {
		var jsonLoader;

		return (jsonLoader = function(uri, jsonp, rerun) {
			if (typeof uri !== "string") {
				return uri;
			}
			var deferred = $q.defer();

			(jsonp ? $http.jsonp(uri + '?callback=JSON_CALLBACK') : $http.get(uri))
				.success(function(data, status, headers, config) {
					deferred.resolve(data);
				}).error(function(data, status, headers, config) {
					if(!jsonp) {
						return jsonLoader(uri, true);
					}

					log.error(log.codes.JSON_LOAD_ERROR, { uri: uri });
					deferred.reject(uri);
				});
			return deferred.promise;
		});
	}]);

})();

/* globals angular,console */

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
	 * @factory log
	 *
	 * Service used for logging debug information.
	 *
	 * @returns A singleton for logging debug, warning and error messages
	 */

	.factory('formulaLog',
	[
	function() {
		var codes = {
			FIELD_INVALID_ID: 'field ID contains an illegal character: {character} ({field})',
			FIELD_MISSING_PROPERTY: 'missing required field property: {property} ({field})',
			FIELD_UNSUPPORTED_FORMAT: 'unsupported string format: {format} ({field})',
			FIELD_UNSUPPORTED_PROPERTY: 'unsupported field property: {property} ({field})',
			FIELD_UNSUPPORTED_TOKEN: 'unsupported default token: {token} ({field})',
			FIELD_UNSUPPORTED_TYPE: 'unsupported field type: {type} ({field})',
			FIELD_HIDDEN_DEFAULT: 'field hidden by default: {field}',
			I18N_MISSING_CODE: 'missing ISO 639-3 language code: {uri}',
			JSON_LOAD_ERROR: 'could not load JSON document: {uri}',
			SCHEMA_INVALID_URI: 'invalid URI for schema deref: {uri}',
			SCHEMA_MISSING_PROPERTY: 'missing required schema property: {property} ({schema})',
			SCHEMA_MISSING_REFERENCE: 'missing schema reference: {schema}',
			MISSING_TEMPLATE: 'missing template for {missing}'
		};

		function codeTranslate(code, params) {
			var msg = code, match = msg.match(/\{[^\}]*\}/g);
			angular.forEach(match, function(v, k) {
				msg = msg.replace(v, params[v.substr(1, v.length - 2)]);
			});
			return msg;
		}

		return {
			codes: codes,
			debug: function(msg, params) {
				if(params) {
					console.debug(codeTranslate(msg, params));
				} else {
					console.debug(msg);
				}
			},
			error: function(code, params) {
				console.error(codeTranslate(code, params));
			},
			warning: function(code, params) {
				console.warn(codeTranslate(code, params));
			}
		};
	}]);

})();

/* globals angular */

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
 * @factory model
 *
 * Service used for data preservation.
 *
 * @returns A constructor for model data preservation.
 */

.factory('formulaModel',
  [function() {
    function Model(data) {
      this.data = ("object" === typeof data ? angular.copy(data) : {});
    }

    return Model;
  }]);

})();

/* globals angular */

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
	 * @factory schema
	 *
	 * Service used to create JSON Schema wrapper class instances.
	 *
	 * @returns schema class constructor
	 */

	.factory('formulaSchema',
	['$q', 'formulaJsonLoader', 'formulaLog',
	function($q, jsonLoader, log) {
		/**
		 * @class schema
		 *
		 * JSON Schema wrapper class.
		 */

		function Schema(uri) {
			this.deferred = null;
			this.json = null;
			this.uri = uri || null;
		}

		Schema.cache = {};

		Schema.prototype = {
			/**
			 * @method compile
			 *
			 * Function used to compile $ref's, effectively replacing the json contents.
			 *
			 * @returns true if all references were successfully solved, otherwise false
			 */

			compile: function() {
				var self = this;

				function selfDeref(path) {
					if(path[0] === '#') {
						path = path.substr(path[1] === '/' ? 2 : 1).split('/');
						var schemaJson = self.json;

						angular.forEach(path, function(subpath) {
							if(schemaJson) {
								schemaJson = (schemaJson[subpath]);
							}
						});

						return schemaJson;
					}

					return null;
				}

				// TODO: Prevent circular refs
				function refCompile(schemaJson, parentJson, parentKey) {
					var missing = [], deref;

					angular.forEach(schemaJson, function(data, key) {
						if(typeof data === 'object') {
							missing = missing.concat(refCompile(data, schemaJson, key));
						} else if(key === '$ref' && parentJson) {
							if(data[0] === '#') {
								if((deref = selfDeref(data))) {
									parentJson[parentKey] = deref;
								} else {
									missing.push(data);
									delete parentJson[parentKey];
								}
							} else {
								if(Schema.cache[data] && Schema.cache[data].json) {
									parentJson[parentKey] = Schema.cache[data].json;
								} else {
									missing.push(data);
									delete parentJson[parentKey];
								}
							}
						}
					});

					return missing;
				}

				var missing = (this.json ? refCompile(this.json) : [ this.uri ]);

				if(missing.length) {
					angular.forEach(missing, function(uri) {
						log.warning(log.codes.SCHEMA_MISSING_REFERENCE, { schema: uri });
					});

					return false;
				}

				return true;
			},

			/**
			 * @method deref
			 *
			 * Function used to retrieve and deref JSON Schema from URI.
			 *
			 * @param uri URI to JSON Schema as string
			 * @returns $q promise object to loaded JSON Schema
			 */

			deref: function(uri) {
				var self = this;
				this.deferred = $q.defer();

				if(uri && typeof uri === 'string') {
					if(!Schema.cache[uri]) {
						var root = {
							schema: Schema.cache[uri] = new Schema(uri),
							missing: null,
							resolve: function(uri) {
								if(uri && this.missing instanceof Array) {
									var index = this.missing.indexOf(uri);
									if(index !== -1) {
										this.missing.splice(index, 1);
									}
								}

								if(!this.missing || !this.missing.length) {
									this.schema.compile();
									self.json = this.schema.json;
									self.deferred.resolve(self.json);
								}
							}
						};

						jsonLoader(uri).then(function(data) {
							root.schema.json = data;
							var missing = root.schema.missing(false);

							if(missing) {
								root.missing = angular.copy(missing);
								angular.forEach(missing, function(uri) {
									if(!Schema.cache[uri]) {
										var ref = new Schema();
										ref.deref(uri).then(function() {
											root.resolve(uri);
										});
									} else {
										Schema.cache[uri].then(function() {
											root.resolve(uri);
										});
									}
								});
							} else {
								root.resolve();
							}
						}, function(error) {
							self.deferred.reject(error);
						});
					} else {
						Schema.cache[uri].then(function(data) {
							self.json = data;
							self.deferred.resolve(data);
						});
					}
				} else {
					log.warning(log.codes.SCHEMA_INVALID_URI, { uri: uri });
					this.deferred.reject('Invalid schema URI: ' + uri);
				}

				return this;
			},

			/**
			 * @method missing
			 *
			 * Function used to find all $ref URIs in schema.
			 * Optionally only return non-cached $ref URIs.
			 *
			 * @param ignoreCached Only return non-chached $ref URIs if true
			 * @returns An array of uncompiled $ref URIs or null if empty
			 */

			missing: function(ignoreCached) {
				function refArray(json) {
					var refs = [];
					angular.forEach(json, function(data, key) {
						if(typeof data === 'object') {
							var subRefs = refArray(data);
							angular.forEach(subRefs, function(ref) {
								refs.push(ref);
							});
						} else if(key === '$ref' && data[0] !== '#') {
							if(!ignoreCached || !Schema.cache[data]) {
								refs.push(data);
							}
						}
					});
					return refs;
				}

				var refs = refArray(this.json);
				return refs.length ? refs : null;
			},

			/**
			 * @method then
			 *
			 * Function running a callback-function when schema is successfully compiled.
			 *
			 * @param callback Callback function with one parameter for JSON data
			 */

			then: function(callback) {
				if(this.deferred) {
					this.deferred.promise.then(function(data) {
						callback(data);
					}, function(error) {
						// TODO: Failed schema promise
					});
				} else {
					callback(this.json);
				}
			}
		};

		return Schema;
	}]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2015, http://npolar.no/
 */

angular.module('formula')

	/**
	 * @filter inlineValues
	 *
	 * Filter used to inline an array of values.
	 */

	.filter('formulaInlineValues', [function() {
		return function(input, params) {
			var result = [];

			angular.forEach(input, function(field) {
				if(field.value instanceof Array) {
					result.push('Array[' + field.value.length + ']');
				} else switch(typeof field.value) {
					case 'string':
					case 'number':
					case 'boolean':
						result.push(field.value);
						break;

					default:
				}
			});

			return result.join(', ');
		};
	}]);

})();

/* globals angular */

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
	 * @filter replace
	 *
	 * Filter used to replace placeholders in a string.
	 */

	.filter('formulaReplace', [function() {
		return function(input, params) {
			var result = input;

			(input.match(/\{[^\}]*\}/g) || [])
			.forEach(function(val) {
				result = result.replace(val, params[val.substr(1, val.length - 2)]);
			});

			return result;
		};
	}]);

})();

/* globals angular */

(function() {
"use strict";

  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */
  angular.module('formula')
    .directive('formulaField', ['$compile', 'formulaClassService',
      function($compile, formulaClassService) {

        return {
          restrict: 'AE',
          scope: {
            field: '='
          },
          link: function (scope, iElement, iAttrs) {
            var field = scope.field;
            if (!field.hidden && field.template) {
              var fieldScope = scope.$new();
              var elem = angular.element(field.template);
              console.log('compile field', field.path, elem);
              fieldScope.field = field;
              formulaClassService.addPathClass(field, elem);
              formulaClassService.addSchemaClass(field, elem);
              $compile(elem)(fieldScope, function(cloned, scope) {
                iElement.append(cloned);
              });
            }
          },
        };
      }
    ]);
})();

/* globals angular */

(function() {
"use strict";

  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */
  angular.module('formula')
    .directive('formulaFields', ['$compile', 'formulaClassService',
      function($compile, formulaClassService) {



        return {
          restrict: 'AE',
          scope: {
            fields: '='
          },
          link: function (scope, iElement, iAttrs) {
            scope.fields.forEach(function (field) {
              if (!field.hidden && field.template) {
                var fieldScope = scope.$new();
                var elem = angular.element(field.template);
                console.log('compile fields', field.path);
                fieldScope.field = field;
                formulaClassService.addPathClass(field, elem);
                formulaClassService.addSchemaClass(field, elem);
                $compile(elem)(fieldScope, function(cloned, scope) {
                  iElement.append(cloned);
                });
              }
            });
          },
        };
      }
    ]);
})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaFieldsets',
	['$compile', 'formulaClassService',
	function($compile, formulaClassService) {
		return {
			restrict: 'AE',
			require: '^^formula',
			link: function(scope, iElement, iAttrs, controller) {
				scope.form.fieldsets.forEach(function (fieldset) {
					console.log('compile fieldset');
					if (!fieldset.hidden && fieldset.template) {
						var fieldsetScope = scope.$new();
						var elem = angular.element(fieldset.template);
						fieldsetScope.fieldset = fieldset;
						formulaClassService.addSchemaClass(fieldset, elem);
						$compile(elem)(fieldsetScope, function(cloned, scope) {
							iElement.append(cloned);
						});
					}
				});
			}
		};
	}]);


})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formula',
	['$compile', '$timeout', 'formulaI18n', 'formulaClassService',
	function($compile, $timeout, i18n, formulaClassService) {
		return {
			restrict: 'AE',
      scope: { options: '=' },
			controller: ['$scope', function($scope) {
				console.log('init controller');
				if(!$scope.options) {
					throw "No formula options provided!";
				}
				var controller = {
					setLanguage: function (uri) {
						var code = i18n.code(uri);
						$scope.language = { uri: uri, code: code };
						if(!code) {
							i18n.add(uri).then(function (code) {
								$scope.language.code = code;

								if ($scope.form) {
									$scope.form.translate(code);
								}
							});
						}
						$timeout();
					},

					setForm: function (form) {
						console.log('set form');
						$scope.form = this.form = form;
					},

					updateTemplates: function () {
						this.form.updateTemplates();
						$timeout();
					}
				};



				controller.setForm($scope.options.form);

				if ($scope.options.language) {
					controller.setLanguage($scope.options.language);
				}

				$scope.options.controller = controller;
			}],
			link: function(scope, iElement, iAttrs) {
				scope.$watch('form', function (form) {
					if (form) {
						console.log('compile form');
						formulaClassService.addSchemaClass(form, iElement);
						iElement.html(form.template);
						$compile(iElement.contents())(scope);
					}
				});
			}
		};
	}]);

})();

/* globals angular */

(function() {
"use strict";

  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */
  angular.module('formula')
    .directive('formulaInput', ['$compile',
      function($compile) {

        var getInputElement = function(field, type, element) {
          var elem;
          switch (type.sub) {
            case 'textarea':
              elem = angular.element('<textarea>');
              break;

            case 'select':
              elem = angular.element('<select>');

              if (element.children().length) {
                angular.forEach(element.children(), function(child) {
                  elem.append(child);
                });
              } else {
                elem.attr('ng-options', 'value.id as value.label for value in field.values');
              }

              if (field.multiple) {
                elem.attr('multiple', 'multiple');
              }
              break;

            default:
              elem = angular.element('<input>');
              elem.attr('type', type.sub);

              switch (type.sub) {
                case 'number':
                case 'range':
                  if (field.step !== null) {
                    elem.attr('step', field.step);
                  }
                  break;

                case 'any':
                case 'date':
                case 'datetime':
                case 'time':
                  elem.attr('type', 'text');
                  break;
              }
          }

          return elem;
        };


        var getType = function(field) {
          var type = field.type ? field.type.split(':') : null;
          type = type ? {
            main: type[0],
            sub: type[1]
          } : null;
          return type;
        };


        var setAttrs = function(attrs) {
          attrs.$set('id', '{{field.uid}}');
          attrs.$set('ngModel', 'field.value');
          attrs.$set('ng-disabled', 'field.disabled');
          attrs.$set('ng-readonly', 'field.readonly');
        };

        var getElement = function(scope, element, attrs) {
          var field = scope.field;
          var type = getType(field);
          var elem = getInputElement(field, type, element);

          angular.forEach(attrs, function(val, key) {
            if (attrs.$attr[key]) {
              elem.attr(attrs.$attr[key], val);
            }
          });
          return elem;
        };

        return {
          restrict: 'AE',
          scope: {
            field: '='
          },
          compile: function (tElement, tAttrs, transclude) {

            return function link(scope, iElement, iAttrs) {
              setAttrs(iAttrs);
              var elem = getElement(scope, iElement, iAttrs);
              elem.removeAttr('formula:input');
              console.log('compile input');
              $compile(elem)(scope, function(cloned, scope) {
                iElement.replaceWith(cloned);
              });
            };
          }
        };
      }
    ]);

})();

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
  .service('formulaClassService', [function() {


    // Add class based on field parents and ID
    var addPathClass = function(node, elem) {
      var path = 'formula-';

      angular.forEach(node.parents, function(parent) {
        path += parent.id + '/';
      });

      if (node.id) {
        path += node.id;
      } else if (node.parents) {
        path = path.substr(0, path.length - 1);
      }

      elem.addClass(path);
    };

    // Add css class of schema type
    var addSchemaClass = function(node, elem) {
      var schemaType = node.mainType;
      if (schemaType) {
        elem.addClass(
          "formula" +
          schemaType.charAt(0).toUpperCase() +
          schemaType.slice(1)
        );
      }
    };


    return {
      addSchemaClass: addSchemaClass,
      addPathClass: addPathClass
    };
  }
]);

})();

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
  .service('formulaEvaluateConditionsService', ['$rootScope',
    function($rootScope) {
      var keepFailing = true;

      var evaluateConditions = function (form) {
        var model = {};
        form.fieldsets.forEach(function (fieldset) {
          fieldset.fields.forEach(function (field) {
            model[field.id] = field.value;
          });
        });
        form.fields().forEach(function (field) {
          evaluateField(field, model);
        });
      };

      var evaluateField = function (field, model) {
        // Evaluate condition
        if (field.condition) {
          var pass = true,
            condition = (field.condition instanceof Array ? field.condition : [field.condition]);

          // jshint -W116
          condition.forEach(function(cond) {
            if (pass) {
              // Relative path
              if (cond[0] !== '#') {
                cond = field.path.substr(0, field.path.lastIndexOf('/') + 1) + cond;
              }
              // Absolute JSON path
              cond = cond.substr(2);
              cond = cond.replace(/\/(\d+)/g, '[$1]');
              cond = cond.replace(/\//g, '.');
              // Disable setters
              cond = cond.replace('=', '==').replace('===', '==');

              pass = $rootScope.$eval(cond, model);
            }
          });

          field.visible = field.hidden ? false : pass;

          if (!keepFailing) {
            if (pass) {
              field.value = field.backupValue;
            } else {
              field.backupValue = field.value;
              field.value = undefined;
            }
          }
        }
      };

      return {
        evaluateConditions: evaluateConditions,
        keepFailing: function (val) {
          keepFailing = val;
        }
      };
    }
  ]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldAttributesService', ['$rootScope', 'formulaLog', 'formulaTemplateService',
          'formulaFieldTranslateDefaultsService', 'formulaFieldTypeService',
    function($rootScope, log,
      templates, formulaFieldTranslateDefaultsService,
      formulaFieldTypeService) {

      var assign = function(field, data) {
        if (typeof field === 'object') {
          var attribs = 'condition,default,description,disabled,enum,format,hidden,maximum,maxLength,minimum,minLength,multiple,nullable,pattern,readonly,required,step,title,type,values'.split(',');
          angular.forEach(data, function(v, k) {
            if (attribs.indexOf(k) !== -1) {
              this[k] = v;
            }
          }, field);
        }
      };

      var watchField = function (field) {
        if (field.typeOf('input')) {
          field.destroyWatcher = $rootScope.$watch(function fieldWatch() {
            return field.value;
          }, function(n, o) {
            if (n !== o) {
              console.log('input watch', field.path, n, field.value);
              if (field.value === null || field.value === "") {
                field.value = undefined;
                return; // triggers new watch
              }
              field.dirty = true;
              for (var i = field.parents.length-1; i>=0; i--) {
                field.parents[i].dirty = true;
                field.parents[i].itemChange(field);
              }
              $rootScope.$emit('revalidate');
            }
          });
        }
      };

      var applyDefaultValue = function (field) {
        if (field.default !== undefined) {
          // Ensure array typed default if required
          if (field.typeOf('array') && !(field.default instanceof Array)) {
            field.default = [field.default];
          }
          field.value = field.default;
        } else if (field.typeOf('array')) {
          field.value = [];
        } else if (field.typeOf('object')) {
          field.value = {};
        }

        // Set intial value for select fields with no default
        // jshint -W116
        // Intentional loose compare (null || undefined)
        if (field.typeOf('select') && !field.multiple && (field.value == null)) {
          field.value = field.enum[0];
        }
      };

      var validateFieldId = function (field) {
        ['.', '/', '#'].forEach(function(invalidChar) {
          if (this.id && this.id.indexOf(invalidChar) >= 0) {
            log.warning(log.codes.FIELD_INVALID_ID, {
              character: invalidChar,
              field: this.path
            });
          }
        }, field);
      };

      /**
       * @method attrsSet
       *
       * Set attributes
       *
       * @returns The updated field instance
       */

      var attrsSet = function(field, options) {
        field.parents = options.parents || [];
        field.id = field.title = options.id;

        assign(field, (field.schema = options.schema));
        assign(field, (field.fieldDefinition = options.fieldDefinition || {}));

        validateFieldId(field);

        field.uidGen();

        formulaFieldTranslateDefaultsService.translateDefaultValues(field);
        formulaFieldTypeService.setFieldType(field);

        if (!field.type) {
          return;
        }

        applyDefaultValue(field);

        if (field.typeOf('array') && field.schema.items && field.fieldDefinition.fields) {
          assign(field.items, field.fieldDefinition.fields[0]);
        }

        if (field.typeOf('array') || field.typeOf('object')) {
          field.fieldAdd();
        }

        // Add one element to arrays which requires at least one element
        if (field.typeOf('array') && field.schema.minItems) {
          field.itemAdd();
        }

        // Set schema pattern if not set and pattern is defined
        if (field.pattern && !field.schema.pattern) {
          field.schema.pattern = field.pattern;
        }

        // Automatically hide fields by default if ID starts with underscore
        if ((field.id && field.id[0] === '_') && field.hidden !== false) {
          log.debug(log.codes.FIELD_HIDDEN_DEFAULT, { field: field.path });
          field.hidden = true;
        }

        watchField(field);

        templates.initNode(field);

        field.visible = field.hidden ? false : true;

        return field;
      };

      return {
        attrsSet: attrsSet
      };
    }]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldTranslateDefaultsService', ['$filter', 'formulaLog',
    function($filter, log) {

      var translateDefaultValues = function(field) {
        if (typeof field.default === 'string') {
          var match = field.default.match(/^%(.*)%$/),
            replace;
          if (match) {
            switch (match[1]) {
              case 'date':
                replace = $filter('date')(new Date(), 'yyyy-MM-dd', 'UTC');
                break;

              case 'datetime':
                replace = $filter('date')(new Date(), 'yyyy-MM-ddThh:mm:ss', 'UTC') + 'Z';
                break;

              case 'time':
                replace = $filter('date')(new Date(), 'hh:mm:ss', 'UTC');
                break;

              case 'year':
                replace = $filter('date')(new Date(), 'yyyy', 'UTC');
                break;

              default:
                log.warning(log.codes.FIELD_UNSUPPORTED_TOKEN, {
                  token: match[1],
                  field: field.path
                });
            }

            if (replace) {
              field.default = replace;
            }
          }
        }
      };
      return {
        translateDefaultValues: translateDefaultValues
      };
    }]);

})();

/* globals angular,tv4 */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldTypeService', ['$filter', 'formulaLog', 'formulaFormat',
    function($filter, log, format) {

      var reduceFieldTypes = function(field) {
        if (field.type instanceof Array) {
          field.nullable = field.type.some(function(type) {
            return type === 'null';
          });
          if (field.type.length === 1) {
            field.type = field.type[0];
          } else if (field.type.length === 2) {
            if (field.type[0] === 'null') {
              field.type = field.type[1];
            } else if (field.type[1] === 'null') {
              field.type = field.type[0];
            }
          } else {
            field.types = field.type;
            field.type = 'any';
            // @TODO support any
          }
        }
      };



      /**
       * Set fieldType and associated properties
       *
       * @param field
       * @param source schema or fieldDefinition
       */
      var setFieldType = function(field) {
        reduceFieldTypes(field);
        field.mainType = 'field';
        if (field.type === 'select' || field.enum) {
          field.type = 'input:select';
          field.values = [];
          field.enum.forEach(function (val) {
            field.values.push({id: val,
            label: val});
          });
        } else {
          if (field.format) {
            var formatNoDash = field.format.replace('-', '');

            if (format[formatNoDash]) {
              switch (formatNoDash) {
                case 'date':
                case 'datetime':
                case 'time':
                  field.type = 'input:' + formatNoDash;
                  break;
                default:
                  field.type = 'input:text';
              }

              tv4.addFormat(field.format, format[formatNoDash]);
            } else {
              log.warning(log.codes.FIELD_UNSUPPORTED_FORMAT, {
                format: field.format,
                field: field.path
              });
              field.type = 'input:text';
            }
          } else {
            switch (field.type) {
              case 'any':
                field.type = 'input:any';
                break;
              case 'array':
                field.mainType = 'array';
                field.values = [];
                if (field.schema.items) {
                  var items = field.schema.items;

                  if (items.type === 'object') {
                    field.type = 'array:fieldset';
                  } else if (items.type === 'array') {
                    field.type = 'array:array';
                  } else if (items.enum) {
                    field.enum = items.enum;
                    field.multiple = true;
                    field.type = 'input:select';
                    field.mainType = 'field';
                  } else if (items.allOf) {
                    // @TODO
                    log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
                      property: 'allOf',
                      field: field.path
                    });
                  } else if (items.anyOf) {
                    // @TODO
                    log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
                      property: 'anyOf',
                      field: field.path
                    });
                  } else if (items.oneOf) {
                    // @TODO
                    log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
                      property: 'oneOf',
                      field: field.path
                    });
                  } else {
                    field.type = 'array:field';
                  }
                  if (field.schema.minItems >= 1) {
                    field.required = true;
                  }
                } else {
                  log.warning(log.codes.FIELD_MISSING_PROPERTY, {
                    property: 'items',
                    field: field.path
                  });
                  field.type = null;
                }
                break;

              case 'boolean':
              case 'checkbox':
                field.type = 'input:checkbox';
                field.value = !!field.value;
                break;

              case 'integer':
              case 'number':
                field.type = 'input:number';
                break;

              case 'range':
                field.type = 'input:range';
                break;

              case 'object':
                field.mainType = 'object';
                if (!field.schema.properties) {
                  log.warning(log.codes.FIELD_MISSING_PROPERTY, {
                    property: 'properties',
                    field: field.path
                  });
                  field.type = null;
                }
                break;

              case 'textarea':
                field.type = 'input:textarea';
                break;

              case 'string':
              case 'text':
                field.type = 'input:text';
                break;
              case undefined:
                field.type = 'input:text';
                break;

              default:
                log.warning(log.codes.FIELD_UNSUPPORTED_TYPE, {
                  type: field.type,
                  field: field.path
                });
                field.type = null;
            }
          }
        }
      };

      return {
        setFieldType: setFieldType
      };
    }]);

})();

/* globals angular,tv4 */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldValidateService', [
    function() {

        var validate = function (field, options) {
          var silent = options.silent, force = options.force;
          if (field.schema) {
            var result;

            if ((field.dirty || force) && (field.required || field.value !== undefined)) {
              result = tv4.validateMultiple(field.value, field.schema);
              field.valid = result.valid;
            }

            if (!field.valid && field.nullable) {
              switch (typeof field.value) {
                case 'string':
                  if (!field.value || !field.value.length) {
                    field.value = null;
                  }
                  break;

                case 'number':
                  if (isNaN(field.value)) {
                    field.value = null;
                  }
                  break;

                case 'object':
                  if (!Object.keys(field.value).length) {
                    field.value = null;
                  }
                  break;
              }

              // Nullable array case..
              if (field.values && !field.values.length) {
                field.value = null;
              }

              // TODO: Add support for null-types in tv4
              if (field.isEmpty()) {
                field.valid = true;
              }
            }

            if (!silent && result && field.valid === false) {
              if (field.typeOf('array') || field.typeOf('object')) {
                field.errors = result.errors;
              } else {
                field.error = result.errors[0];
              }
            } else {
              field.error = null;
              field.errors = null;
            }
            field.dirty = false;

            return field.valid !== false;
          }
          return false;
        };

        return {
          validate: validate
        };
      }]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldValueFromModelService', ['formulaTemplateService',
    function(templates) {
      var valueFromModel = function (field, model) {
        if (model[field.id] !== undefined) {

          if (field.type === "object") {
            field.fields.forEach(function(fc, index) {
              if (model[field.id][fc.id] !== undefined) {
                valueFromModel(fc, model[field.id]);
              }
            });
          } else if (field.typeOf("array")) {
            field.values = [];
            model[field.id].forEach(function(item, index) {
              var newField;
              if (field.typeOf('fieldset')) {
                newField = field.itemAdd(true /* preventValidation */);
                if (newField.index !== 0) {
                  newField.visible = false;
                }
                if (newField) {
                  var valueModel = {};
                  valueModel[field.values[index].id] = item;
                  valueFromModel(field.values[index], valueModel);
                }
              } else if (field.typeOf('field')) {
                newField = field.itemAdd(true /* preventValidation */);
                if (newField) {
                  field.values[index].value = item;
                }
              } else {
                // @TODO Support array:array
                // jshint -W035
              }
            }, field);
          }

          if (field.value !== model[field.id]) {
            field.value = model[field.id];
            field.dirty = true;
            templates.initNode(field);
          }
        }
      };

      return {
        valueFromModel: valueFromModel
      };
    }]);

})();

/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaTemplateService', ['$templateCache', '$templateRequest', '$q', 'formulaLog',
    function($templateCache, $templateRequest, $q, log) {

      var DEFAULT_TEMPLATES = [
        {
          match: 'field',
          templateUrl: 'formula/default/field.html'
        },
        {
          match: 'object',
          templateUrl: 'formula/default/object.html'
        },
        {
          match: 'array',
          templateUrl: 'formula/default/array.html'
        },
        {
          match: 'fieldset',
          templateUrl: 'formula/default/fieldset.html'
        },
        {
          match: 'form',
          templateUrl: 'formula/default/form.html'
        }
      ];

      var templates = DEFAULT_TEMPLATES;

      var getMatchingConfig = function(templates, node) {
        var config;
        templates.forEach(function (tmpl) {
          if (tmpl.match) {
            if ((typeof tmpl.match === 'function') && tmpl.match.call({}, node)) {
              config = tmpl;
            } else if (typeof tmpl.match === 'string' && [node.mainType, node.id, node.path].indexOf(tmpl.match) !== -1) {
              config = tmpl;
            }
          }
        });
        return config;
      };

      var doTemplateRequest = function (templateUrl) {
        var templateElement = $templateCache.get(templateUrl);
        if (!templateElement) {
          return $templateRequest(templateUrl, false);
        }
        var deferred = $q.defer();
        deferred.resolve(templateElement);
        return deferred.promise;
      };


      var getTemplate = function(field) {
        var config = getMatchingConfig(templates, field);
        var deferred = $q.defer();
        if (config) {
          if (config.hidden) {
            deferred.resolve(false);
          } else if (config.template) {
            deferred.resolve(config.template);
          } else if (config.template === "") {
            deferred.resolve(false);
          } else if (config.templateUrl) {
            doTemplateRequest(config.templateUrl).then(function (template) {
              deferred.resolve(template);
            }, function () {
              deferred.reject(config.templateUrl);
            });
          } else {
            deferred.resolve(false);
          }
        } else {
          deferred.reject(field.mainType);
        }

        return deferred.promise;
      };

      var initNode = function (node) {
        getTemplate(node).then(function (template) {
          if (template) {
            node.template = template;
          }
        }, function (missing) {
          log.warning(log.codes.MISSING_TEMPLATE, {
            missing: missing
          });
        });
      };

      var setTemplates = function (tmpls) {
        templates = tmpls;
      };

      var addTemplate = function (template) {
        templates.push(template);
      };

      return {
        addTemplate: addTemplate,
        setTemplates: setTemplates,
        initNode: initNode,
      };
    }
  ]);

})();

angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/default/array.html","<fieldset ng-class=\"{ valid: field.valid, error: field.errors }\"><legend>{{ field.title }} ({{ field.nrArrayValues() || 0 }})</legend><ul ng-if=\"::field.typeOf(\'fieldset\')\"><li ng-repeat=\"value in field.values track by value.path\" ng-if=\"!value.hidden\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.fields | formulaInlineValues }}</span> <a class=\"toggle\" href=\"\" ng-click=\"field.itemToggle($index)\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></legend><formula:field field=\"value\" ng-if=\"value.visible\"></formula:field></fieldset></li><li><span ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: field.errors.length } }}</span> <span ng-if=\"!field.errors\">{{ field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ form.i18n.add[1] }}\" type=\"button\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul><ul ng-if=\"::field.typeOf(\'field\')\"><li ng-class=\"{ valid: value.valid, error: value.error }\" ng-repeat=\"value in field.values track by value.path\"><input formula:input=\"\" field=\"value\"> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></li><li><span ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: field.errors.length } }}</span> <span ng-if=\"!field.errors\">{{ field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ form.i18n.add[1] }}\" type=\"button\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul></fieldset>");
$templateCache.put("formula/default/field.html","<div ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value == null) }\" ng-if=\"field.visible\" title=\"{{ field.description }}\"><label for=\"{{ ::field.uid }}\">{{ field.title }} {{field.visibility}}</label><formula:input field=\"field\"></formula:input><span>{{ field.error.message || field.description }}</span></div>");
$templateCache.put("formula/default/fieldset.html","<fieldset ng-show=\"fieldset.active\"><formula:fields fields=\"::fieldset.fields\"></formula:fields></fieldset>");
$templateCache.put("formula/default/form.html","<form class=\"formula\"><header ng-if=\"::form.title\">{{ form.title }}</header><nav ng-if=\"::form.fieldsets.length > 1\"><a href=\"\" ng-class=\"{ active: fieldset.active }\" ng-click=\"form.activate(fieldset)\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\">{{ fieldset.title }}</a></nav><formula:fieldsets></formula:fieldsets><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-click=\"form.validate(true);\" ng-if=\"!data.hideButtons\" title=\"{{ form.i18n.validate[1] }}\"><strong>&#10003;</strong> {{ form.i18n.validate[0] }}</button> <button ng-click=\"form.save()\" ng-disabled=\"!form.valid\" ng-if=\"!data.hideButtons\" title=\"{{ form.i18n.save[1] }}\"><strong>&#9921;</strong> {{ form.i18n.save[0] }}</button></footer></form><div class=\"formula\" ng-if=\"!form.fieldsets\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div>");
$templateCache.put("formula/default/object.html","<fieldset><legend ng-if=\"::field.title\">{{ field.title }}</legend><formula:fields fields=\"::field.fields\"></formula:fields></fieldset>");}]);;