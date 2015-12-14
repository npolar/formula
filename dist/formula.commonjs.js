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
	function() {
		return {
			restrict: 'A',
			require: '^formula',
			compile: function(element, attrs) {
				attrs.$set('formulaFieldDefinition'); // unset
				var html = element.html();

				return function(scope, element, attrs, controller) {
					controller.fieldDefinition = html;
				};
			}
		};
	});


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
			compile: function() {
				// TODO: append element.html() to element?

				return function(scope, element, attrs, controller) {
					var elem = angular.element(controller.fieldDefinition);
					$compile(elem)(scope, function (cloned, scope) {
						element.prepend(cloned);
					});
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
    .directive('formulaField', ['$compile', '$q', 'formulaModel', 'formulaCustomTemplateService',
    'formulaEvaluateConditionsService',
      function($compile, $q, model, formulaCustomTemplateService, formulaEvaluateConditionsService) {

        var getInputElement = function (scope, element, attrs) {
          var elem;
          var field = scope.field;
          var type = getType(field);
          var deferred = $q.defer();
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

          angular.forEach(attrs, function(val, key) {
            if (attrs.$attr[key]) {
              elem.attr(attrs.$attr[key], val);
            }
          });

          if (type.sub === 'autocomplete') {
            var list = angular.element('<datalist>');
            var id = field.id + '_list';
            elem = angular.element('<input>');
            elem.attr('list', id);
            list.attr('id', id);
            field.querySearch('').then(function (matches) {
              matches.forEach(function (item) {
                var opt = angular.element('<option>');
                opt.attr('value', item);
                list.append(opt);
              });
              deferred.resolve(elem);
            });
            elem.append(list);
          } else {
            deferred.resolve(elem);
          }

          return deferred.promise;
        };


        var getType = function (field) {
          var type = field.type ? field.type.split(':') : null;
          type = type ? {
            main: type[0],
            sub: type[1]
          } : null;
          return type;
        };


        var setAttrs = function (field, attrs) {
          attrs.$set('id', field.uid);
          attrs.$set('ngModel', 'field.value');
          attrs.$set('formulaField'); // unset

          if (field.disabled) {
            attrs.$set('disabled', 'disabled');
          }

          if (field.readonly) {
            attrs.$set('readonly', 'readonly');
          }
        };

        var initScope = function (scope, controllers) {
          scope.form = controllers[0].form;
          scope.backupValue = null;

          if (controllers[1]) {
            scope.field = controllers[1].field;
          }
        };

        // Add class based on field parents and ID
        var addPathClass = function (field, elem) {
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
        var addSchemaClass = function (field, elem) {
          var schemaType = field.schema.type;
          if (schemaType) {
            elem.addClass(
              "formula" +
              schemaType.charAt(0).toUpperCase() +
              schemaType.slice(1)
            );
          }
        };

        var getElement = function (scope, element, attrs, controllers) {
          var deferred = $q.defer();
          var field = scope.field;
          var type = getType(field);
          formulaCustomTemplateService.getCustomTemplate(controllers[0].data.templates, field)
          .then(
            // custom template
            function (template) {
              var elem = angular.element(template);
              elem.addClass('formulaCustomObject');
              deferred.resolve(elem);
          },

          // no custom template
          function () {
            if (type.main === 'input') {
              getInputElement(scope, element, attrs, type).then(function (elem) {
                deferred.resolve(elem);
              });
            } else {
              deferred.resolve(angular.element(element));
            }
          });

          return deferred.promise;
        };

        var watchFields = function (scope, field) {
          var type = getType(field);
          if (type.main === 'input') {
            scope.$watch('field.value', function(n, o) {
              if (n !== o && scope.form) {
                field.dirty = true;
                field.parents.forEach(function (parent) {
                  parent.dirty = true;
                });
                scope.form.validate();
              }
            });
          }
        };

        return {
          restrict: 'A',
          require: ['^formula', '?^formulaFieldInstance'],
          scope: {
            field: '=formulaField'
          },
          link: function(scope, element, attrs, controllers) {
            var field = scope.field;

            initScope(scope, controllers);
            setAttrs(field, attrs);

            getElement(scope, element, attrs, controllers).then(function (elem) {
              addPathClass(field, elem);
              addSchemaClass(field, elem);

              $compile(elem)(scope, function(cloned, scope) {
                element.replaceWith(cloned);
              });
            });

            watchFields(scope, field);

            formulaEvaluateConditionsService.evaluateConditions(scope, field);
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
	['formulaJsonLoader', 'formulaModel', 'formulaSchema', 'formulaForm', 'formulaI18n', '$http', '$compile', '$templateCache', '$templateRequest', '$q',
	function(jsonLoader, model, Schema, Form, i18n, $http, $compile, $templateCache, $templateRequest, $q) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				if(!$scope.data) {
					throw "No formula options provided!";
				}

				$scope.schema = new Schema();
				if($scope.data.model) {
					model.data = $scope.data.model;
				}

				$scope.template = $scope.data.template || 'default';
				$scope.language = { uri: $scope.data.language || null, code: null };

				function loadTemplate (templateId) {
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
				}

				var asyncs = [$scope.schema.deref($scope.data.schema)];
				if ($scope.data.form) {
					asyncs.push(jsonLoader($scope.data.form));
				}

				var formLoaded = $q.all(asyncs).then(function(data) {
					$scope.form = $scope.data.formula = new Form($scope.data.form);
					$scope.form.build(data[0], data[1]);
					$scope.form.translate($scope.language.code);
					return true;
				});

				loadTemplate($scope.data.template).then(function (templateElement) {
					$compile(angular.element(templateElement))($scope, function (cloned, scope) {
						$element.prepend(cloned);
					});
				});

				// Enable language hot-swapping
				$scope.$watch('data.language', function(newUri, oldUri) {
					if (newUri && newUri !== oldUri) {
						var code = i18n.code(newUri);
						formLoaded.then(function () {
							if(!code) {
								i18n.add(newUri).then(function(code) {
									$scope.language.code = code;
									$scope.form.translate(code);
								});
							} else {
								$scope.language.code = code;
								$scope.form.translate(code);
							}
						});
					}
				});

				// Enable data hot-swapping
				$scope.$watch('data.model', function(newData, oldData) {
					if (newData && newData !== oldData) {
						formLoaded.then(function () {
							if(model.set(newData)) {
								$scope.form.updateValues();
							}
						});
					}
				}, true);

				this.data = $scope.data; // Others need this
			}]
		};
	}]);

})();

'use strict';
/* globals angular,tv4 */

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

.factory('formulaField', ['$filter', 'formulaLog', 'formulaFormat', 'formulaAutoCompleteService',
  function($filter, log, format, formulaAutoCompleteService) {
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

    function Field(data, id, parents) {
      if (typeof data === 'object') {
        this.id = id || data.id || null;
        this.index = null;
        this.nullable = data.nullable || false;
        this.parents = parents || [];
        this.path = null;
        this.schema = data.schema || data;

        var invalidCharacters = ['.', '/', '#'];
        angular.forEach(invalidCharacters, function(char) {
          if (this.id && this.id.indexOf(char) >= 0) {
            log.warning(log.codes.FIELD_INVALID_ID, {
              character: char,
              field: this.path
            });
          }
        }, this);

        this.uidGen();
        this.pathGen();
        this.attrsSet(data);
      }
    }

    var translateDefaultValues = function (field) {
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

    var setArrayFieldTypes = function (field, source) {
      if (source.type instanceof Array) {
        field.nullable = source.type.some(function (type) {
          return type === 'null';
        });
        if (source.type.length === 1) {
          source.type = source.type[0];
        } else if (source.type.length === 2) {
          if (source.type[0] === 'null') {
            source.type = source.type[1];
          } else if (source.type[1] === 'null') {
            source.type = source.type[0];
          }
        } else {
          source.types = source.type;
          source.type = 'any';
          // @TODO support any
        }
      }
    };

    var setFieldType = function (field, source) {
      if (field.autocomplete) {
        field.type = 'input:autocomplete';
      } else if (source.type === 'select' || source.enum) {
        field.type = 'input:select';
        field.multiple = !!source.multiple;
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
          switch (source.type) {
            case 'input:any':
              field.type = 'input:any';
              break;
            case 'array':
            case 'array:field':
            case 'array:fieldset':
            case 'array:array':
              field.values = [];
              if (source.items) {
                if (source.items.type === 'object') {
                  field.type = 'array:fieldset';
                  field.fieldAdd(source.items);
                } else if (source.items.type === 'array') {
                  field.type = 'array:array';
                  field.fieldAdd(source.items);
                } else if (source.items.enum) {
                  field.enum = source.items.enum;
                  field.multiple = true;
                  field.type = 'input:select';
                } else if (source.items.allOf) {
                  // @TODO
                  log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
                    property: 'allOf',
                    field: field.path
                  });
                } else if (source.items.anyOf) {
                  // @TODO
                  log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
                    property: 'anyOf',
                    field: field.path
                  });
                } else if (source.items.oneOf) {
                  // @TODO
                  log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
                    property: 'oneOf',
                    field: field.path
                  });
                } else {
                  field.type = 'array:field';
                  field.fieldAdd(source.items);
                }
                if (source.minItems >= 1) {
                  field.required = true;
                }
              } else if (source.fields) {
                field.type = source.type;
                field.fields = source.fields;
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
            case 'input:checkbox':
              field.type = 'input:checkbox';
              field.value = false;
              break;

            case 'input:number':
            case 'integer':
            case 'number':
              field.step = source.step || null;
              field.type = 'input:number';
              break;

            case 'input:range':
            case 'range':
              field.step = source.step || null;
              field.type = 'input:range';
              break;

            case 'object':
              if (source.properties) {
                field.type = 'object';
                field.fieldAdd(source);
              } else if (source.fields) {
                field.type = 'object';
                field.fields = source.fields;
              } else {
                log.warning(log.codes.FIELD_MISSING_PROPERTY, {
                  property: 'properties',
                  field: field.path
                });
                field.type = null;
              }
              break;

            case 'input:textarea':
            case 'textarea':
              field.type = 'input:textarea';
              break;

            case 'input:text':
            case 'string':
            case 'text':
              field.type = 'input:text';
              break;
            case undefined:
              field.type = (field.type || 'input:text');
              break;

            default:
              log.warning(log.codes.FIELD_UNSUPPORTED_TYPE, {
                type: source.type,
                field: field.path
              });
              field.type = null;
          }
        }
      }
    };

    Field.uids = [];

    Field.prototype = {

      /**
       * @method attrsSet
       *
       * Function used to copy attributes from a source object.
       * Useful when creating fields inheriting data from a fomr definition file.
       *
       * @param source Source object the data should be copied from
       * @returns The updated field instance
       */

      attrsSet: function(source) {
        var attribs = 'autocomplete,condition,default,description,disabled,enum,format,hidden,maximum,maxLength,minimum,minLength,multiple,pattern,readonly,required,step,title,values'.split(',');
        angular.forEach(source, function(v, k) {
          if (attribs.indexOf(k) !== -1) {
            this[k] = v;
          }
        }, this);

        translateDefaultValues(this);
        setArrayFieldTypes(this, source);
        setFieldType(this, source);

        // Set schema pattern if not set and pattern is defined
        if (this.pattern && this.schema && !this.schema.pattern) {
          this.schema.pattern = this.pattern;
        }

        // Add one element to arrays which requires at least one element
        if (this.typeOf('array') && this.schema.minItems) {
          this.itemAdd();
        }

        // Automatically hide fields by default if ID starts with underscore
        if ((this.id && this.id[0] === '_') && this.hidden !== false) {
          log.debug(log.codes.FIELD_HIDDEN_DEFAULT, {
            field: this.path
          });
          this.hidden = true;
        }

        this.visible = this.hidden ? false : true;

        if (this.value === undefined) {
          if ((this.value = source.value) === undefined) {
            if ((this.value = this.default) === undefined) {
              this.value = null;
            }
          }
        }

        // Ensure array typed default if required
        if (this.default && source.type === 'array') {
          if (!(this.default instanceof Array)) {
            this.default = [this.default];
          }
        }

        // Set intial value for select fields with no default
        if (this.type === 'input:select' && !this.multiple && (this.value === null)) {
          this.value = this.enum[0];
        }

        //Init autocomplete fields
        if (this.typeOf('autocomplete')) {
          formulaAutoCompleteService.initField(this);
        }

        return this;
      },

      /**
       * @method fieldAdd
       *
       * Function used to add subfields to object and array-typed field.
       *
       * @param schema JSON Schema defining the field being added
       * @returns true if the field was successfully added, otherwise false
       */

      fieldAdd: function(schema) {
        if (typeof schema === 'object') {
          if (!this.fields) {
            this.fields = [];
          }

          var parents = [];
          angular.forEach(this.parents, function(parent) {
            parents.push(parent);
          });
          parents.push({
            id: this.id,
            index: this.index
          });

          if (schema.type === 'object' && !this.typeOf('array')) {
            angular.forEach(schema.properties, function(val, key) {
              var newField = new Field(val, key, parents);
              newField.required = (schema.required && schema.required.indexOf(key) !== -1);

              if (newField.type) {
                this.fields.push(newField);
              }
            }, this);
          } else {
            var id = schema.id || (this.id || /\/(.*?)$/.exec(this.path)[1]) + '_' + schema.type;
            var newField = new Field(schema, id, parents);
            newField.index = this.fields.length;
            this.fields.push(newField);
          }

          return true;
        }

        // TODO: Warning
        return false;
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
       * @returns Reference to the item just added
       */
      itemAdd: function() {
        if (this.typeOf('array') && this.fields) {
          var parents = [], index;
          this.parents.forEach(function(parent) {
            parents.push(parent);
          });
          parents.push({
            id: this.id,
            index: this.index
          });

          index = this.values.push(angular.copy(this.fields[0])) - 1;
          var field = this.values[index];
          field.index = index;
          field.parents = parents;
          field.uidGen();
          field.pathGen();

          this.dirty = true;
          this.validate(false);
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
          }

          this.values.forEach(function(fs, i) {
            fs.index = i;
            fs.pathGen();
          }, this);

          this.dirty = true;
          this.validate(false);
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
       * Function used to generate full JSON path for fields.
       */
      pathGen: function() {
        this.path = '#/';

        angular.forEach(this.parents, function(parent) {
          if (parent.index !== null) {
            this.path += parent.index + '/';
          }

          this.path += parent.id + '/';
        }, this);

        if (this.index !== null) {
          this.path += this.index;

          if (this.id) {
            this.path += '/' + this.id;
          }
        } else if (this.id) {
          this.path += this.id;
        }
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
        if (this.type && typeof type === 'string') {
          var types = this.type.split(':'),
            match = false;

          angular.forEach(type.split(' '), function(type) {
            if (!match && type === this.type || type === types[0] || type === types[1]) {
              match = true;
            }
          }, this);

          return match;
        }

        return false;
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
      isEmpty: function () {
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
      validate: function(force) {
        if (this.schema) {
          var tempValue, match;
          this.valid = true;

          switch (this.type) {
            case 'array:fieldset':
            case 'array:field':
              this.value = [];
              angular.forEach(this.values, function(field) {
                if (field.dirty || force) {
                  field.validate(force);
                }
                this.value.push(field.value);
              }, this);
              break;

            case 'input:any':
              if (this.value) {
                if (!isNaN(this.value)) {
                  tempValue = Number(this.value);
                } else if ((match = this.value.match(/^\[(.*)\]$/))) {
                  tempValue = [match[1]];
                } else {
                  switch (this.value.toLowerCase()) {
                    case 'true':
                      tempValue = true;
                      break;
                    case 'false':
                      tempValue = false;
                      break;
                    case 'null':
                      tempValue = null;
                      break;
                  }
                }
              }
              break;

            case 'input:checkbox':
              this.value = !!this.value;
              break;

            case 'input:integer':
            case 'input:number':
            case 'input:range':
              tempValue = (this.value === null ? NaN : Number(this.value));
              break;

            case 'input:select':
              if (this.multiple && !this.value) {
                this.value = [];
              } else {
                switch (this.schema.type) {
                  case 'integer':
                  case 'number':
                    this.value = Number(this.value);
                    break;
                }
              }
              break;

            case 'object':
              this.value = {};
              if (this.fields) {
                angular.forEach(this.fields, function(field, index) {
                  if (field.dirty || force) {
                    field.validate(force);
                  }
                  this.value[field.id] = field.value;
                }, this);
              }
              break;
          }

          if ((this.dirty || force) && (this.required || !this.isEmpty())) {
            this.valid = tv4.validate((tempValue !== undefined ? tempValue : this.value), this.schema);
          }

          if (!this.valid && this.nullable) {
            switch (typeof this.value) {
              case 'string':
                if (!this.value || !this.value.length) {
                  this.value = null;
                }
                break;

              case 'number':
                if (isNaN(this.value)) {
                  this.value = null;
                }
                break;

              case 'object':
                if (!Object.keys(this.value).length) {
                  this.value = null;
                }
                break;
            }

            // TODO: Add support for null-types in tv4
            if (this.isEmpty()) {
              this.valid = true;
            }
          }

          this.error = !this.valid ? tv4.error.message: null;
          this.dirty = false;
          return this.valid;
        }

        return false;
      },

      /**
       * @method valueFromModel
       *
       * Function used to set field value based on model object.
       *
       * @param model
       */

      valueFromModel: function(model) {
        if (model[this.id] !== undefined) {

          if (this.type === "object") {
            this.fields.forEach(function(field, index) {
              if (model[this.id][field.id]) {
                field.valueFromModel(model[this.id]);
              }
            }, this);
          } else if (this.typeOf("array")) {
            this.values = [];


            model[this.id].forEach(function(item, index) {
              this.itemAdd();
              if (this.typeOf('fieldset')) {
                var valueModel = {};
                valueModel[this.values[index].id] = item;
                this.values[index].valueFromModel(valueModel);
              } else if (this.typeOf('field')) {
                this.values[index].value = item;
              } else {
                // @TODO Support array:array
                // jshint -W035
              }
            }, this);
          } else {
            this.value = model[this.id];
            this.dirty = true;
          }
          this.validate(false);
        }
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
	function() {
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
	});

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
  function() {
    var model = {
      data: {},
      set: function(data) {
        if (data) {
          this.data = data;
          return true;
        }

        return false;
      }
    };

    return model;
  });

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

	.filter('formulaInlineValues', function() {
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
	});

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

	.filter('formulaReplace', function() {
		return function(input, params) {
			var result = input, match = input.match(/\{[^\}]*\}/g);

			angular.forEach(match, function(v, k) {
				result = result.replace(v, params[v.substr(1, v.length - 2)]);
			});

			return result;
		};
	});

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

      var defineSourceFunction = function(key, cb) {
        sources[key] = cb;
      };

      var getSource = function(source, q) {
        var deferred = $q.defer();

        if (isFn(source)) {
          // source is a registred function
          deferred.resolve(sources[source].call({}));
        } else if (URI_REGEX.test(source)) {
          // source is uri
          var config = q ? {
            params: {
              q: q
            }
          } : {};
          $http.get(source, config).then(function (response) {
            deferred.resolve(response.data);
          }, function (response) {
            deferred.reject(new Error(ERR + source));
          });
        } else if (source.constructor === Array) {
          // source is array
          deferred.resolve(source);
        } else if (isObject(source)) {
          // source is object
          getSource(source.source, q).then(function (response) {
            deferred.resolve(sources[source.callback].call({}, response));
          }, function (response) {
            deferred.reject(new Error(ERR + source));
          });
        } else {
          deferred.resolve(source.filter(function (item) { return item.indexOf(q) !== -1; }));
        }

        return deferred.promise;
      };

      var initField = function (field) {
        field.source = [];
        getSource(field.autocomplete).then(function (source) {
          field.source = source;
        }, function (e) {
          console.warn(e);
          field.source = [];
        });
        field.querySearch = function (q) {
          return getSource(field.autocomplete, q);
        };
      };

      return {
        defineSourceFunction: defineSourceFunction,
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


      var getCustomTemplate = function(templates, field) {
        var deferred = $q.defer();
        var template = getMatchingTemplate(templates, field);
        if (template) {
          if (template.template) {
            deferred.resolve(angular.element(template.template));
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

      return {
        getCustomTemplate: getCustomTemplate
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
  .service('formulaEvaluateConditionsService', ['formulaModel',
    function(model) {
      var evaluateConditions = function(scope, field) {
        // Evaluate condition
        if (field.condition) {
          scope.model = model.data;
          scope.$watchCollection('model', function(model) {
            var pass = true,
              condition = (field.condition instanceof Array ? field.condition : [field.condition]);

            angular.forEach(condition, function(cond) {
              var local = model,
                parents = field.parents,
                pathSplitted;

              if (pass) {
                // Absolute JSON path
                if (cond[0] === '#') {
                  parents = [];

                  // Slash-delimited resolution
                  if (cond[1] === '/') {
                    pathSplitted = cond.substr(1).split('/');
                  }

                  // Dot-delimited resolution
                  else {
                    pathSplitted = cond.substr(1).split('.');
                    if (!pathSplitted[0].length) {
                      parents.splice(0, 1);
                    }
                  }

                  angular.forEach(pathSplitted, function(split, index) {
                    if (isNaN(split)) {
                      parents.push({
                        id: split,
                        index: null
                      });
                    } else if (index > 0) {
                      parents[index - 1].index = Number(split);
                    }
                  });

                  cond = parents[parents.length - 1].id;
                  parents.splice(parents.length - 1, 1);
                }

                angular.forEach(parents, function(parent) {
                  if (local) {
                    local = (parent.index !== null ? local[parent.index][parent.id] : local[parent.id]);
                  }
                });

                if (local && field.index !== null) {
                  local = local[field.index];
                }

                var evaluate = scope.$eval(cond, local);
                if (!local || evaluate === undefined || evaluate === false) {
                  pass = false;
                }
              }
            });

            if (field.visible !== (field.visible = field.hidden ? false : pass)) {
              var currentValue = field.value;
              field.value = scope.backupValue;
              scope.backupValue = currentValue;
            }
          });
        }
      };

      return {
        evaluateConditions: evaluateConditions
      };
    }
  ]);

angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/bootstrap3.html","<form class=\"form-horizontal\" ng-if=\"form.fieldsets\"><header ng-if=\"form.title\" class=\"page-header\" style=\"margin-top: -10px\"><h2>{{ form.title }}</h2></header><ul class=\"nav nav-tabs\"><li ng-repeat=\"fieldset in form.fieldsets\" ng-if=\"form.fieldsets.length > 1\" ng-class=\"{ active: fieldset.active }\"><a href=\"\" ng-click=\"form.activate(fieldset)\">{{ fieldset.title }}</a></li></ul><fieldset ng-repeat=\"fieldset in form.fieldsets\" ng-if=\"fieldset.active\" style=\"border: 1px solid #ddd; border-radius: 0 0 5px 5px; border-top: 0; padding: 15px; padding-bottom: 0;\"><div ng-repeat=\"field in fieldset.fields\" ng-show=\"field.visible\" formula:field-definition=\"\"><div ng-if=\"field.typeOf(\'input\')\" title=\"{{ field.description }}\" class=\"form-group has-feedback\"><label for=\"{{ field.uid }}\" class=\"col-sm-3 control-label\">{{ field.title }}</label><div class=\"col-sm-9\" ng-class=\"{ \'has-error\': field.error, \'has-success\': field.valid, \'has-warning\': (field.required && field.value === null) }\"><div ng-if=\"!field.typeOf(\'select\')\"><input class=\"form-control input-md\" formula:field=\"field\"><div ng-if=\"!field.typeOf(\'checkbox\') && (field.error || field.valid)\"><span ng-if=\"field.valid\" class=\"glyphicon glyphicon-ok form-control-feedback\"></span> <span ng-if=\"field.error\" class=\"glyphicon glyphicon-remove form-control-feedback\"></span></div></div><select ng-if=\"field.typeOf(\'select\')\" class=\"form-control input-md\" formula:field=\"field\"><option ng-repeat=\"value in field.values\" value=\"{{ value.id }}\">{{ value.label }}</option></select><span class=\"help-block\">{{ field.error || field.description }}</span></div></div><div ng-if=\"field.typeOf(\'object\')\"><div class=\"panel\" ng-class=\"{ \'panel-danger\': field.error, \'panel-success\': field.valid }\" formula:field=\"field\"><div class=\"panel-heading\">{{ field.title }}</div><div class=\"panel-body\"><div ng-repeat=\"field in field.fields\" ng-show=\"field.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></div></div></div><div ng-if=\"field.typeOf(\'array\')\"><div formula:field=\"field\"><div ng-if=\"field.typeOf(\'fieldset\')\" class=\"panel\" ng-class=\"{ \'panel-danger\': field.error, \'panel-success\': field.valid }\"><div class=\"panel-heading\">{{ field.title }} ({{ field.values.length || 0 }})</div><ul class=\"list-group\"><li class=\"list-group-item\" ng-repeat=\"value in field.values\"><fieldset><legend style=\"border: none; margin-bottom: 10px; text-align: right;\"><span ng-class=\"{ \'text-danger\': !value.valid, \'text-success\': value.valid }\" class=\"pull-left\" ng-if=\"!value.visible\" style=\"white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 80%; text-align: left;\">{{ value.fields | formulaInlineValues }}</span> <button style=\"font-family: monospace;\" class=\"btn btn-sm btn-info\" ng-click=\"field.itemToggle($index)\" type=\"button\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</button> <button class=\"btn btn-sm btn-danger\" ng-click=\"field.itemRemove($index)\" type=\"button\" title=\"{{ form.i18n.remove[1] }}\">X</button></legend><formula:field-instance field=\"value\" ng-show=\"value.visible\"></formula:field-instance></fieldset></li></ul><div class=\"panel-footer clearfix has-feedback\" ng-class=\"{ \'has-error\': field.error, \'has-success\': field.valid }\"><span class=\"help-block\"><span>{{ field.error || field.description }}</span> <button class=\"btn btn-sm btn-primary pull-right\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\">{{ form.i18n.add[0] }}</button></span></div></div><div ng-if=\"field.typeOf(\'field\')\" class=\"panel\" ng-class=\"{ \'panel-danger\': field.error, \'panel-success\': field.valid }\"><div class=\"panel-heading\">{{ field.title }}</div><ul class=\"list-group\"><li class=\"list-group-item\" ng-repeat=\"value in field.values\"><div class=\"input-group\"><input formula:field=\"value\" class=\"form-control input-md\"> <span class=\"input-group-btn\"><button class=\"btn btn-danger\" ng-click=\"field.itemRemove($index)\" type=\"button\" title=\"{{ form.i18n.remove[1] }}\">X</button></span></div></li></ul><div class=\"panel-footer clearfix has-feedback\" ng-class=\"{ \'has-error\': field.error, \'has-success\': field.valid }\"><span class=\"help-block\"><span>{{ field.error || field.description }}</span> <button class=\"btn btn-sm btn-primary pull-right\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\">{{ form.i18n.add[0] }}</button></span></div></div></div></div></div></fieldset><div class=\"has-feedback\" ng-class=\"{ \'has-error\': !form.valid, \'has-success\': form.valid }\" style=\"margin-top: 10px;\"><span class=\"help-block\"><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span><div ng-if=\"!data.hideButtons\" class=\"btn-group pull-right\"><button type=\"button\" class=\"btn btn-info\" ng-click=\"form.validate(true)\" title=\"{{ form.i18n.validate[1] }}\">{{ form.i18n.validate[0] }}</button> <button type=\"button\" class=\"btn btn-success\" ng-class=\"{ disabled: !form.valid }\" ng-click=\"form.save()\" title=\"{{ form.i18n.save[1] }}\">{{ form.i18n.save[0] }}</button></div></span></div></form><div ng-if=\"!form.fieldsets\" class=\"alert alert-info\" style=\"text-align: center; overflow: hidden;\"><span>Loading schema...</span></div>");
$templateCache.put("formula/default.html","<form class=\"formula\" ng-if=\"form.fieldsets\"><header ng-if=\"form.title\">{{ form.title }}</header><nav ng-if=\"form.fieldsets.length > 1\"><a ng-repeat=\"fieldset in form.fieldsets\" ng-class=\"{ active: fieldset.active }\" href=\"\" ng-click=\"form.activate(fieldset)\">{{ fieldset.title }}</a></nav><fieldset ng-repeat=\"fieldset in form.fieldsets\" ng-if=\"fieldset.active\"><legend ng-if=\"fieldset.title\">{{ fieldset.title }}</legend><div ng-repeat=\"field in fieldset.fields\" ng-show=\"field.visible\" formula:field-definition=\"\"><div ng-if=\"field.typeOf(\'input\')\" title=\"{{ field.description }}\" ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value == null) }\"><label for=\"{{ field.uid }}\">{{ field.title }}</label> <input formula:field=\"field\"> <span>{{ field.error || field.description }}</span></div><div ng-if=\"field.typeOf(\'object\')\"><fieldset formula:field=\"field\"><legend ng-if=\"field.title\">{{ field.title }}</legend><div ng-repeat=\"field in field.fields\" ng-show=\"field.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></fieldset></div><div ng-if=\"field.typeOf(\'array\')\"><div formula:field=\"field\"><fieldset ng-class=\"{ valid: field.valid, error: field.error }\"><legend>{{ field.title }} ({{ field.values.length || 0 }})</legend><ul ng-if=\"field.typeOf(\'fieldset\')\"><li ng-repeat=\"value in field.values\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.fields | formulaInlineValues }}</span> <a href=\"\" class=\"toggle\" ng-click=\"field.itemToggle($index)\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a href=\"\" class=\"remove\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></legend><formula:field-instance field=\"value\" ng-show=\"value.visible\"></formula:field-instance></fieldset></li><li><span>{{ field.error || field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul><ul ng-if=\"field.typeOf(\'field\')\"><li ng-repeat=\"value in field.values\" ng-class=\"{ valid: value.valid, error: value.error }\"><input formula:field=\"value\"> <a href=\"\" class=\"remove\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a> <span ng-if=\"value.error\">{{ value.error }}</span></li><li><span>{{ field.error || field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul></fieldset></div></div></div></fieldset><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-if=\"!data.hideButtons\" ng-click=\"form.validate(true)\" title=\"{{ form.i18n.validate[1] }}\"><strong>&#10003;</strong> {{ form.i18n.validate[0] }}</button> <button ng-if=\"!data.hideButtons\" ng-disabled=\"!form.valid\" ng-click=\"form.save()\" title=\"{{ form.i18n.save[1] }}\"><strong>&#9921;</strong> {{ form.i18n.save[0] }}</button></footer></form><div class=\"formula\" ng-if=\"!form.fieldsets\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div>");}]);;