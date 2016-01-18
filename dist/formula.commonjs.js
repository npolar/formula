var angular = require("angular");var tv4 = require("tv4");module.exports = "use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula', []);

"use strict";
/* globals angular */

(function() {

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaFieldDefinition',
	[function() {
		return {
			restrict: 'A',
			require: '^formula',
			scope: false,
			compile: function(element, attrs) {
				var html = element.html();

				return function(scope, element, attrs, controller) {
					controller.fieldDefinition = html;
				};
			}
		};
	}]);


})();

"use strict";
/* globals angular */

(function() {
/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaFieldInstance',
	['$compile',
	function($compile) {
		return {
			restrict: 'AE',
			require: '^formula',
			scope: { field: '=' },
			link: function(scope, element, attrs, controller) {
				scope.form = controller.form;
				element[0].innerHTML = controller.fieldDefinition;
				$compile(element.contents())(scope);
			}
		};
	}]);


})();

"use strict";
/* globals angular */

(function() {


  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */
  angular.module('formula')
    .directive('formulaField', ['$compile', '$q',
      function($compile, $q) {

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

          if (type.sub === 'autocomplete') {
            var list = angular.element('<datalist>');
            var id = field.id + '_list';
            elem = angular.element('<input>');
            elem.attr('list', id);
            list.attr('id', id);
            field.querySearch('').then(function(matches) {
              matches.forEach(function(item) {
                var opt = angular.element('<option>');
                opt.attr('value', item);
                list.append(opt);
              });
            });
            list.on('change', field.onSelect);
            elem.append(list);
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

        // Add class based on field parents and ID
        var addPathClass = function(field, elem) {
          var path = 'formula-';

          angular.forEach(field.parents, function(parent) {
            path += parent.id + '/';
          });

          if (field.id) {
            path += field.id;
          } else if (field.parents) {
            path = path.substr(0, path.length - 1);
          }

          elem.addClass(path);
        };

        // Add css class of schema type
        var addSchemaClass = function(field, elem) {
          var schemaType = field.mainType;
          if (schemaType) {
            elem.addClass(
              "formula" +
              schemaType.charAt(0).toUpperCase() +
              schemaType.slice(1)
            );
          }
        };

        var getElement = function(scope, element, attrs, controllers) {
          var field = scope.field;
          var type = getType(field);
          var elem;

          if (field.customTemplate) {
            elem = angular.element(field.customTemplate);
            elem.addClass('formulaCustomObject');
          } else if (type.main === 'input') {
            elem = getInputElement(field, type, element);
          }

          if (elem) {
            angular.forEach(attrs, function(val, key) {
              if (attrs.$attr[key]) {
                elem.attr(attrs.$attr[key], val);
              }
            });
          } else {
            elem = element;
          }

          return elem;
        };

        return {
          restrict: 'A',
          require: ['^formula', '?^formulaFieldInstance'],
          scope: {
            field: '=*formulaField'
          },
          compile: function (tElement, tAttrs, transclude) {
            setAttrs(tAttrs);

            return function link(scope, iElement, iAttrs, controllers) {
              iAttrs.$set('formulaField'); // unset
              scope.form = controllers[0].form;
              var field = scope.field;

              var elem = getElement(scope, iElement, iAttrs, controllers);

              addPathClass(field, elem);
              addSchemaClass(field, elem);

              $compile(elem)(scope, function(cloned, scope) {
                iElement.replaceWith(cloned);
              });
            };
          },
          terminal: true
        };
      }
    ]);

})();

"use strict";
/* globals angular */

(function() {
/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formula',
	['formulaJsonLoader', 'formulaSchema', 'formulaForm', 'formulaI18n',
		'formulaCustomTemplateService', '$http', '$compile', '$templateCache', '$templateRequest', '$q', '$rootScope',
	function(jsonLoader, Schema, Form, i18n, formulaCustomTemplateService, $http, $compile, $templateCache, $templateRequest, $q, $rootScope) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				var ctrl = this;
				if(!$scope.data) {
					throw "No formula options provided!";
				}

				var setLanguage = function (uri) {
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
				};

				var loadTemplate = function (templateId) {
					return $q(function(resolve, reject) {
						var prefix = 'formula/';
						var defaultTemplate = 'default.html';
						var templateCahceKey, templateElement;

						templateId = templateId || defaultTemplate;

						if (templateId.substr(-5) !== '.html') {
							templateId += '.html';
						}

						templateCahceKey = prefix + templateId;

						if(!(templateElement = $templateCache.get(templateCahceKey))) {
							$templateRequest(templateId, false /* ingoreErrors */).then(function (tmpl) {
								templateElement = tmpl;
								resolve(templateElement);
							},
							function () {
								templateElement = $templateCache.get(prefix + defaultTemplate);
								resolve(templateElement);
							});
						} else {
							resolve(templateElement);
						}
					});
				};

				$scope.schema = new Schema();

				formulaCustomTemplateService.setTemplates($scope.data.templates);

				$scope.template = $scope.data.template || 'default';
				setLanguage($scope.data.language);

				var asyncs = [loadTemplate($scope.data.template),
					$scope.schema.deref($scope.data.schema), Promise.resolve($scope.data.model)];
				if ($scope.data.form) {
					asyncs.push(jsonLoader($scope.data.form));
				}

				var formLoaded = $q.all(asyncs).then(function(responses) {
					$scope.form = ctrl.form = $scope.data.formula = new Form(responses[1], responses[2], responses[3]);
					$scope.form.onsave = $scope.data.onsave || $scope.form.onsave;
					$scope.form.translate($scope.language.code);
					$compile(angular.element(responses[0]))($scope, function (cloned, scope) {
						$element.prepend(cloned);
					});
					$scope.data.ready = true;
					return true;
				});

				// Enable language hot-swapping
				$scope.$watch('data.language', function(newUri, oldUri) {
					if (newUri && newUri !== oldUri) {
						formLoaded.then(function () {
							setLanguage(newUri);
						});
					}
				});

				// Enable data hot-swapping
				$scope.$watchCollection('data.model', function(newData, oldData) {
					if (newData && newData !== oldData) {
						formLoaded.then(function () {
							$scope.form.updateValues(newData);
						});
					}
				});

				// Enable template hot-swapping
				$scope.$watchCollection('data.templates', function(newData, oldData) {
					if (newData && newData !== oldData) {
						formulaCustomTemplateService.setTemplates(newData);
						if ($scope.form) {
							$scope.form.updateCustomTemplates();
						}
					}
				});

				// Don't leave memory leaks
				$scope.$on('$destroy', function () {
					$scope.form.fields().forEach(function (field) {
						if (typeof field.destroyWatcher === 'function') {
							field.destroyWatcher();
						}
					});
					$rootScope.$on('revalidate', function () {});
				});

				this.data = $scope.data; // Others need this
			}]
		};
	}]);

})();

'use strict';
/* globals angular */

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
              angular.forEach(this.values, function(field) {
                if (field.value !== undefined) {
                  this.value.push(field.value);
                }
              }, this);
            }
            break;
          case 'object':
            if (this.fields) {
              this.value = {};
              angular.forEach(this.fields, function(field, index) {
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
        // intetional ==
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
.factory('formulaForm', ['$rootScope', 'formulaJsonLoader', 'formulaModel', 'formulaField', 'formulaI18n',
  'formulaEvaluateConditionsService', 'formulaCustomTemplateService',
  function($rootScope, jsonLoader, model, Field, i18n, formulaEvaluateConditionsService, formulaCustomTemplateService) {
    function fieldsetFromSchema(schema, data) {
      if (schema && schema.type === 'object') {
        var fieldsets = [{
          fields: [],
          id: 'the-fieldset'
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
            id: fs.title + i
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
      this.title = null;
      this.valid = false;
      model.data = angular.copy(data || {});

      if (formDefinition) {
        this.title = formDefinition.title;
        this.fieldsets = fieldsetFromDefinition(schema, formDefinition, model.data);
      } else {
        this.fieldsets = fieldsetFromSchema(schema, model.data);
      }

      this.onsave = function(model) {
        window.open("data:application/json," + JSON.stringify(model));
      };

      var self = this;
      $rootScope.$on('revalidate', function() {
        self.validate();
      });
      this.validate(true, true);
    }

    Form.prototype = {

      fields: function () {
        var fields = [];
        var push = function (field) {
          fields.push(field);
        };
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            if (field.typeOf('array')) {
              field.values.forEach(push);
            } else if (field.typeOf('object')) {
              field.fields.forEach(push);
            }
            push(field);
          });
        });
        return fields;
      },

      updateValues: function(data) {
        model.data = angular.copy(data);
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            field.valueFromModel(data);
          });
        });
        this.validate(false, true);
      },

      updateCustomTemplates: function () {
        this.fields().forEach(function (field) {
          formulaCustomTemplateService.initField(field);
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
              model.data[field.id] = field.value;
            } else {
              delete model.data[field.id];
            }
          });
        });
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
			datefullyear: // RCF 3339 four-digit year
			function(data, schema) {
				if(typeof data === 'string' && /^\d{4}$/.test(data)) {
					return null;
				}

				return 'RFC 3339 fullyear, e.g. 2015';
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

"use strict";
/* globals angular */

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
			SCHEMA_MISSING_REFERENCE: 'missing schema reference: {schema}'
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
 * @factory model
 *
 * Service used for data preservation.
 *
 * @returns A singleton for preserving data
 */

.service('formulaModel',
  [function() {
    var model = {
      data: {}
    };


    return model;
  }]);

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

"use strict";
/* globals angular */

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
	 * @filter replace
	 *
	 * Filter used to replace placeholders in a string.
	 */

	.filter('formulaReplace', [function() {
		return function(input, params) {
			var result = input, match = input.match(/\{[^\}]*\}/g);

			angular.forEach(match, function(v, k) {
				result = result.replace(v, params[v.substr(1, v.length - 2)]);
			});

			return result;
		};
	}]);

"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaAutoCompleteService', ['$http', '$q',
    function($http, $q) {

      const URI_REGEX = /^(https?|\/\/)/;
      const ERR = "Invalid autocomplete source ";

      var sources = {};
      var selects = {};

      var isFn = function(key) {
        return sources[key] && sources[key].constructor === Function;
      };

      var isObject = function(source) {
        return source.constructor === Object &&
          source.hasOwnProperty('source') && source.hasOwnProperty('callback');
      };

      var isURI = function(source) {
        return source && (URI_REGEX.test(source) || (isObject(source) && isURI(source.source)));
      };

      var bindSourceCallback = function(fieldPath, cb) {
        sources[fieldPath] = cb;
      };

      var bindSelectCallback = function(fieldPath, cb) {
        selects[fieldPath] = cb;
      };

      var filterSource = function (source, q) {
        if (!q || typeof source[0] !== "string") {
          return source;
        }
        source = source.filter(function (item) {
          return item.toLowerCase().indexOf(q.toLowerCase()) === 0;
        });
        return source;
      };

      var getSource = function(field, source, q) {
        var deferred = $q.defer();

        if (URI_REGEX.test(source)) {
          // source is uri
          var config = {
            params: {
              q: q || ''
            }
          };
          $http.get(source, config).then(function (response) {
            deferred.resolve(getSource(field, response.data, q));
          }, function (response) {
            deferred.reject(new Error(ERR + source));
          });
        } else {
          if (source.constructor !== Array) {
            source = [];
          }

          // source is a registred function
          if (isFn(field.path)) {
            deferred.resolve(filterSource(sources[field.path].call(field, source), q));
          } else {
            deferred.resolve(filterSource(source, q));
          }
        }

        return deferred.promise;
      };

      var initField = function (field) {
        field.source = [];
        field.onSelect = function (item) {
          if (selects[field.path]) {
            selects[field.path].call(field, item);
          }
        };
        field.querySearch = function (q) {
          return getSource(field, field.autocomplete, q);
        };
      };

      return {
        bindSourceCallback: bindSourceCallback,
        bindSelectCallback: bindSelectCallback,
        getSource: getSource,
        isURI: isURI,
        initField: initField
      };
    }
  ]);

"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaCustomTemplateService', ['$templateCache', '$templateRequest', '$q',
    function($templateCache, $templateRequest, $q) {

      var templates;

      var getMatchingTemplate = function(templates, field) {
        if (templates) {
          for (var i in templates) {
            if (templates[i].match && templates[i].match.call({}, field)) {
              return templates[i];
            }
          }
        }
        return null;
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


      var getCustomTemplate = function(template, field) {
        var deferred = $q.defer();
        if (template) {
          if (template.hidden) {
            deferred.resolve(false);
            // intentional != (allow empty string)
            // jshint -W116
          } else if (template.template != null) {
            if (template.template === "") {
              deferred.resolve(false);
            } else {
              deferred.resolve(template.template);
            }
          } else if (template.templateUrl) {
            doTemplateRequest(template.templateUrl).then(function (template) {
              deferred.resolve(template);
            }, function () {
              deferred.reject();
            });
          } else {
            deferred.reject();
          }
        } else {
          deferred.reject();
        }

        return deferred.promise;
      };

      var initField = function (field) {
        if (!templates) {
          return;
        }
        var template = getMatchingTemplate(templates, field);
        if (!template) {
          return;
        }
        getCustomTemplate(template, field).then(function (template) {
          if (template) {
            field.customTemplate = template;
          } else {
            field.hidden = true;
          }
        });
      };

      var setTemplates = function (tmpls) {
        templates = tmpls;
      };

      return {
        setTemplates: setTemplates,
        initField: initField
      };
    }
  ]);

"use strict";
/* globals angular */

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
      var values = {};
      var evaluateConditions = function (form) {
        form.fieldsets.forEach(function (fieldset) {
          fieldset.fields.forEach(function (field) {
            values[field.id] = field.value;
            evaluateField(field);
          });
        });
      };

      var evaluateField = function (field) {
        if (field.typeOf('array')) {
          field.values.forEach(function (value) {
            evaluateField(value);
          });
        } else if (field.typeOf('object')) {
          field.fields.forEach(function (subfield) {
            evaluateField(subfield);
          });
        }

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

              var evaluate = $rootScope.$eval(cond, values);

              if (!values || evaluate === undefined || evaluate === false) {
                pass = false;
              }
            }
          });

          if (field.visible !== (field.visible = field.hidden ? false : pass)) {
            var currentValue = field.value;
            field.value = field.backupValue;
            field.backupValue = currentValue;
          }
        }
      };

      return {
        evaluateConditions: evaluateConditions
      };
    }
  ]);

"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldAttributesService', ['$rootScope', 'formulaLog',
          'formulaAutoCompleteService', 'formulaCustomTemplateService',
          'formulaFieldTranslateDefaultsService', 'formulaFieldTypeService',
    function($rootScope, log, formulaAutoCompleteService,
      formulaCustomTemplateService, formulaFieldTranslateDefaultsService,
      formulaFieldTypeService) {

      var copyFrom = function(field, data) {
        if (typeof field !== 'object') {
          return;
        }
        var attribs = 'autocomplete,condition,default,description,disabled,enum,format,hidden,maximum,maxLength,minimum,minLength,multiple,nullable,pattern,readonly,required,step,title,type,values'.split(',');
        angular.forEach(data, function(v, k) {
          if (attribs.indexOf(k) !== -1) {
            this[k] = v;
          }
        }, field);
      };

      var watchField = function(field) {
        if (field.typeOf('input')) {
          field.destroyWatcher = $rootScope.$watch(function fieldWatch() {
            return field.value;
          }, function(n, o) {
            if (n !== o) {
              field.dirty = true;
              for (var i = field.parents.length-1; i>=0; i--) {
                field.parents[i].dirty = true;
                field.parents[i].itemChange(field);
              }
              $rootScope.$emit('revalidate');
            }
          }, true);
        }
      };

      /**
       * @method attrsSet
       *
       * Set attributes
       *
       * @returns The updated field instance
       */

      var attrsSet = function(field, options) {
        var schema = options.schema, id = options.id,
        parents = options.parents, fieldDefinition = options.fieldDefinition;
        field.parents = parents || [];
        field.id = field.title = id;
        field.schema = schema;
        field.fieldDefinition = fieldDefinition || {};
        copyFrom(field, schema);
        copyFrom(field, fieldDefinition);

        var invalidCharacters = ['.', '/', '#'];
        invalidCharacters.forEach(function(char) {
          if (this.id && this.id.indexOf(char) >= 0) {
            log.warning(log.codes.FIELD_INVALID_ID, {
              character: char,
              field: this.path
            });
          }
        }, field);

        field.uidGen();

        formulaFieldTranslateDefaultsService.translateDefaultValues(field);
        formulaFieldTypeService.setFieldType(field);
        if (!field.type) {
          return field;
        }

        if (field.typeOf('array')) {
          field.value = [];
        }

        if (field.typeOf('object')) {
          field.value = {};
        }

        if (field.typeOf('select')) {
          field.values = [];
          field.enum.forEach(function (val) {
            field.values.push({id: val,
            label: val});
          });
        }

        if (field.typeOf('array') && field.schema.items && field.fieldDefinition.fields) {
          copyFrom(field.items, field.fieldDefinition.fields[0]);
        }

        if (field.typeOf('array') || field.typeOf('object')) {
          field.fieldAdd();
        }

        formulaCustomTemplateService.initField(field);

        // Set schema pattern if not set and pattern is defined
        if (field.pattern && !field.schema.pattern) {
          field.schema.pattern = field.pattern;
        }

        // Add one element to arrays which requires at least one element
        if (field.typeOf('array') && field.schema.minItems) {
          field.itemAdd();
        }

        // Automatically hide fields by default if ID starts with underscore
        if ((field.id && field.id[0] === '_') && field.hidden !== false) {
          log.debug(log.codes.FIELD_HIDDEN_DEFAULT, {
            field: field.path
          });
          field.hidden = true;
        }

        field.visible = field.hidden ? false : true;

        // Ensure array typed default if required
        if (field.default && field.typeOf('array')) {
          if (!(field.default instanceof Array)) {
            field.default = [field.default];
          }
        }

        // Set default
        if (field.default !== undefined) {
          field.value = field.default;
        }

        // Set intial value for select fields with no default
        if (field.typeOf('select') && !field.multiple && (field.value == null)) {
          field.value = field.enum[0];
        }

        //Init autocomplete fields
        if (field.typeOf('autocomplete')) {
          formulaAutoCompleteService.initField(field);
        }

        watchField(field);

        return field;
      };
      return {
        attrsSet: attrsSet
      };
    }]);

"use strict";
/* globals angular */

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

"use strict";
/* globals angular,tv4 */

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
          field.mainType = field.type;
        } else {
          field.mainType = field.schema.type;
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
        if (field.autocomplete) {
          field.type = 'input:autocomplete';
        } else if (field.type === 'select' || field.enum) {
          field.type = 'input:select';
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

"use strict";
/* globals angular,tv4 */

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

            if (field.value === null || field.value === "") {
              field.value = undefined;
            }

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

"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaFieldValueFromModelService', ['formulaCustomTemplateService',
    function(formulaCustomTemplateService) {
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
            formulaCustomTemplateService.initField(field);
          }
        }
      };

      return {
        valueFromModel: valueFromModel
      };
    }]);

angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/default.html","<!DOCTYPE html><form class=\"formula\" ng-if=\"form.fieldsets\"><header ng-if=\"::form.title\">{{ ::form.title }}</header><nav ng-if=\"::form.fieldsets.length > 1\"><a href=\"\" ng-class=\"{ active: fieldset.active }\" ng-click=\"form.activate(fieldset)\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\">{{ fieldset.title }}</a></nav><fieldset ng-if=\"fieldset.active\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\"><div formula:field-definition=\"\" ng-repeat=\"field in ::fieldset.fields track by field.id\" ng-if=\"field.visible\"><div ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value == null) }\" ng-if=\"::field.typeOf(\'input\')\" title=\"{{ field.description }}\"><label for=\"{{ ::field.uid }}\">{{ field.title }}</label> <input formula:field=\"field\"> <span>{{ field.error.message || field.description }}</span></div><div ng-if=\"::field.typeOf(\'object\')\"><fieldset formula:field=\"field\"><legend ng-if=\"::field.title\">{{ field.title }}</legend><div ng-repeat=\"field in ::field.fields track by field.id\" ng-if=\"field.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></fieldset></div><div ng-if=\"::field.typeOf(\'array\')\"><div formula:field=\"field\"><fieldset ng-class=\"{ valid: field.valid, error: field.errors }\"><legend>{{ field.title }} ({{ field.nrArrayValues() || 0 }})</legend><ul ng-if=\"::field.typeOf(\'fieldset\')\"><li ng-repeat=\"value in field.values track by value.path\" ng-if=\"!value.hidden\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.fields | formulaInlineValues }}</span> <a class=\"toggle\" href=\"\" ng-click=\"field.itemToggle($index)\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></legend><div ng-repeat=\"field in ::value.fields track by field.id\" ng-if=\"value.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></fieldset></li><li><span ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: field.errors.length } }}</span> <span ng-if=\"!field.errors\">{{ field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ form.i18n.add[1] }}\" type=\"button\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul><ul ng-if=\"::field.typeOf(\'field\')\"><li ng-class=\"{ valid: value.valid, error: value.error }\" ng-repeat=\"value in field.values track by value.path\"><input formula:field=\"value\"> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></li><li><span ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: field.errors.length } }}</span> <span ng-if=\"!field.errors\">{{ field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ form.i18n.add[1] }}\" type=\"button\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul></fieldset></div></div></div></fieldset><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-click=\"form.validate(true);\" ng-if=\"!data.hideButtons\" title=\"{{ form.i18n.validate[1] }}\"><strong>&#10003;</strong> {{ form.i18n.validate[0] }}</button> <button ng-click=\"form.save()\" ng-disabled=\"!form.valid\" ng-if=\"!data.hideButtons\" title=\"{{ form.i18n.save[1] }}\"><strong>&#9921;</strong> {{ form.i18n.save[0] }}</button></footer></form><div class=\"formula\" ng-if=\"!form.fieldsets\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div>");}]);;