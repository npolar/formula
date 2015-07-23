var angular = require("angular");var tv4 = require("tv4");module.exports = /**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula', []);

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
					$compile(elem)(scope);
					element.prepend(elem);
				};
			}
		};
	}]);

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaField',
	['$compile', 'formulaModel',
	function($compile, model) {
		return {
			restrict: 'A',
			require: [ '^formula', '?^formulaFieldInstance' ],
			scope: { field: '=formulaField' },
			link: function(scope, element, attrs, controller) {
				var field = scope.field;
				scope.form = controller[0].form;
				scope.backupValue = null;
				
				if(controller[1]) {
					scope.field = controller[1].field;
				}
				
				attrs.$set('id', field.uid);
				attrs.$set('ngModel', 'field.value');
				attrs.$set('formulaField'); // unset
				
				if(field.disabled) {
					attrs.$set('disabled', 'disabled');
				}
				
				var elem = angular.element(element);
				var type = field.type ? field.type.split(':') : null;
				type = type ? { main: type[0], sub: type[1] } : null;
				
				if(type.main == 'input') {
					switch(type.sub) {
					case 'textarea':
						elem = angular.element('<textarea>');
						break;
						
					case 'select':
						elem = angular.element('<select>');
						
						if(element.children().length) {
							angular.forEach(element.children(), function(child) {
								elem.append(child);
							});
						} else {
							elem.attr('ng-options', 'value.id as value.label for value in field.values');
						}
						
						if(field.multiple) {
							elem.attr('multiple', 'multiple');
						}
						break;
						
					default:
						elem = angular.element('<input>');
						elem.attr('type', type.sub);
						
						switch(type.sub) {
						case 'number':
						case 'range':
							if(field.step !== null) {
								elem.attr('step', field.step);
							}
							break;
						
						case 'any':
							elem.attr('type', 'text');
							break;
						}
					}
					
					angular.forEach(attrs, function(val, key) {
						if(attrs.$attr[key]) {
							elem.attr(attrs.$attr[key], val);
						}
					});
				}
				
				// Add class based on field parents and ID
				var path = 'formula-';
				
				angular.forEach(field.parents, function(parent) {
					path += parent.id + '/';
				});
				
				if(field.id) {
					path += field.id;
				} else if(field.parents) {
					path = path.substr(0, path.length - 1);
				}
				
				elem.addClass(path);
				
				$compile(elem)(scope);
				element.replaceWith(elem);
				
				if(type.main == 'input') {
					scope.$watch('field.value', function(n, o) {
						if(!field.dirty && (n !== o)) {
							field.dirty = true;
						}
						
						if(!field.parents) {
							field.validate(true, true);
						}
					});
				} else if(type.main == 'object') {
					scope.$watch('field.fields', function() {
						field.validate(false, true);
					}, true);
				} else if(type.main == 'array') {
					scope.$watch('field.values', function() {
						field.validate(false, true);
					}, true);
				}
				
				// Evaluate condition
				if(field.condition) {
					scope.model = model.data;
					scope.$watchCollection('model', function(model) {
						var pass = true, condition = (field.condition instanceof Array ? field.condition : [ field.condition ]);
						
						angular.forEach(condition, function(cond) {
							var local = model, subCond, parents = field.parents, pathSplitted;
							
							if(pass) {
								// Absolute JSON path
								if(cond[0] == '#') {
									parents = [];
									
									// Slash-delimited resolution
									if(cond[1] == '/') {
										pathSplitted = cond.substr(1).split('/');
									}
									
									// Dot-delimited resolution
									else {
										pathSplitted = cond.substr(1).split('.');
										if(!pathSplitted[0].length) {
											parents.splice(0, 1);
										}
									}
									
									angular.forEach(pathSplitted, function(split, index) {
										if(isNaN(split)) {
											parents.push({ id: split, index: null });
										} else if(index > 0) {
											parents[index - 1].index = Number(split);
										}
									});
									
									cond = parents[parents.length - 1].id;
									parents.splice(parents.length - 1, 1);
								}
								
								angular.forEach(parents, function(parent) {
									if(local) {
										local = (parent.index !== null ? local[parent.index][parent.id] : local[parent.id]);
									}
								});
								
								if(local && field.index !== null) {
									local = local[field.index];
								}
								
								var evaluate = scope.$eval(cond, local);
								if(!local || evaluate === undefined || evaluate === false) {
									pass = false;
								}
							}
						});
						
						if(field.visible != (field.visible = field.hidden ? false : pass)) {
							var currentValue = field.value;
							field.value = scope.backupValue;
							scope.backupValue = currentValue;
						}
					});
				}
			},
			terminal: true
		};
	}]);

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formula',
	['formulaJsonLoader', 'formulaModel', 'formulaSchema', 'formulaForm', 'formulaI18n', '$http', '$compile', '$templateCache',
	function(jsonLoader, model, schema, form, i18n, $http, $compile, $templateCache) {
		return {
			restrict: 'A',
            scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				var controller = this, formBuffer = { pending: false, data: null };
				
				if($scope.data.model) {
					model.data = $scope.data.model;
					model.locked = true;
				}
				
				controller.schema	= $scope.schema = new schema();
				controller.form  	= $scope.form = new form();
				
				$scope.onsave		= $scope.form.onsave;
				$scope.template 	= $scope.data.template || 'default';
				$scope.language 	= { uri: $scope.data.language || null, code: null };
				
				function formBuild(formURI) {
					if(!formBuffer.pending || formURI) {
						$scope.schema.then(function(schemaData) {
							if(schemaData) {
								formBuffer.pending = false;
								controller.form = $scope.form = new form(formURI);
								$scope.form.onsave = $scope.onsave;
								$scope.form.build(schemaData, formBuffer.data);
								$scope.form.translate($scope.language.code);
								
								$scope.form.uiSaveHidden		= $scope.data.saveHidden;
								$scope.form.uiValidateHidden	= $scope.data.validateHidden;
							}
						});
					}
				}
                
				// Enable form definition hot-swapping
                $scope.$watch('data.form', function(uri) {
                    if(uri) {
                        formBuffer.pending = true;
                        jsonLoader(uri).then(function(data) {
                            formBuffer.data = data;
                            formBuild(uri);
                        });
                    } else {
                        formBuffer.data = null;
                        formBuild(null);
                    }
                });
				
				// Enable schema hot-swapping
				$scope.$watch('data.schema', function(uri) {
					if(($scope.schema.uri = uri)) {
						$scope.schema.deref(uri).then(function(schemaData) {
							formBuild();
						});
					}
				});
				
				// Enable template hot-swapping
				$scope.$watch('data.template', function(template) {
					var templateName = 'formula/' + (template || ""), templateElement;
					
					if(templateName.substr(0, -5) != '.html') {
						templateName += '.html';
					}
					
					if(!(templateElement = $templateCache.get(templateName))) {
						templateElement = $templateCache.get('formula/default.html');
					}
					
					if($element.prop('tagName') == 'FORM') {
						$element.empty();
						$element.append(templateElement.children());
						$compile($element.children())($scope);
					} else {
						$element.empty();
						$element.prepend(templateElement);
						$compile($element.children())($scope);
					}
				});
				
				// Enable language hot-swapping
				$scope.$watch('data.language', function(uri) {
					var code = i18n.code(uri);
					
					if(uri && !code) {
						i18n.add(uri).then(function(code) {
							$scope.language.code = code;
							$scope.form.translate(code);
						});
					} else {
						$scope.language.code = code;
						$scope.form.translate(code);
					}
				});
				
				// Enable data hot-swapping
				$scope.$watch('data.model', function(data) {
					if(!formBuffer.pending && model.set(data)) {
						formBuild();
					}
					
					model.locked = false;
				}, true);
				
				// Enable onsave callback hot-swapping
				$scope.$watch('data.onsave', function(callback) {
					if(callback) {
						$scope.form.onsave = $scope.onsave = callback;
					}
				});
			}]
		};
	}]);

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
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
				if(field.value === null) {
					result.push('null');
				} else if(field.value === undefined) {
					result.push('undefined');
				} else if(field.value instanceof Array) {
					result.push('Array[' + field.value.length + ']');
				} else switch(typeof field.value) {
					case 'string':
						var strlen = field.value.length;
						
						if(strlen && strlen < 10) {
							result.push(field.value);
						} else if(strlen) {
							result.push(field.value.substr(0, 10) + '...');
						}
						
						break;
						
					case 'number':
					case 'boolean':
						result.push(field.value);
						break;
						
					default:
						result.push('Object');
				}
			});
			
			return result.join(', ');
		};
	});

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

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	
	/**
	 * @factory field
	 * 
	 * Service used to create HTML form field handler class instances.
	 * 
	 * @returns field class constructor
	 */
	
	.factory('formulaField',
	['$filter', 'formulaLog', 'formulaFormat',
	function($filter, log, format) {
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
		
		function field(data, id, parents) {
			if(typeof data == 'object') {
				this.dirty = false;
				this.form = null;
				this.id = id || data.id || null;
				this.index = null;
				this.nullable = data.nullable || false;
				this.parents = parents || null;
				this.path = null;
				this.schema = data.schema || data;
				
				var invalidCharacters = ['.', '/', '#'];
				angular.forEach(invalidCharacters, function(char) {
					if(this.id && this.id.indexOf(char) >= 0) {
						log.warning(log.codes.FIELD_INVALID_ID, { character: char, field: this.path });
					}
				}, this);
				
				this.uidGen();
				this.pathGen();
				this.attrsSet(data);
			}
		}
		
		field.uids = [];
		
		field.prototype = {
			
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
				var attribs = 'condition,default,description,disabled,enum,format,hidden,maximum,maxLength,minimum,minLength,multiple,pattern,required,step,title,values'.split(',');
				angular.forEach(source, function(v, k) {
					if(attribs.indexOf(k) != -1) {
						this[k] = v;
					}
				}, this);
				
				// Translate default value tokens
				if(typeof this.default == 'string') {
					var match = this.default.match(/^%(.*)%$/), replace;
					if(match) {
						switch(match[1]) {
						case 'date':
							replace = $filter('date')(new Date(), 'yyyy-MM-dd', 'UTC');
							break;
							
						case 'datetime':
							replace = $filter('date')(new Date(), 'yyyy-MM-ddThh:mm:ss', 'UTC') + 'Z';
							break;
							
						case 'time':
							replace = $filter('date')(new Date(), 'hh:mm:ss', 'UTC');
							break;
							
						default:
							log.warning(log.codes.FIELD_UNSUPPORTED_TOKEN, { token: match[1], field: this.path });
						}
						
						if(replace) {
							this.default = replace;
						}
					}
				}
				
				if(this.fields && source.fields) {
					var formFields = [];
					
					// Update field properties based on form specification
					angular.forEach(source.fields, function(field) {
						if(typeof field == 'object') {
							var fieldMatch = this.fieldFromID(field.id);
							
							if(fieldMatch) {
								formFields.push(field.id);
								fieldMatch.attrsSet(field);
							}
						} else if(typeof field == 'string') {
							formFields.push(field);
						}
					}, this);
					
					// Remove unused fields
					for(var f in this.fields) {
						if(formFields.indexOf(this.fields[f].id) == -1) {
							this.fields.splice(f, 1);
						}
					}
				}
				
				if(source.type instanceof Array) {
					if(source.type.length == 1) {
						source.type = source.type[0];
					} else if(source.type.length == 2) {
						if(source.type[0] == 'null') {
							source.type = source.type[1];
							this.nullable = true;
						} else if(source.type[1] == 'null') {
							source.type = source.type[0];
							this.nullable = true;
						}
					}
				}
				
				if(source.type == 'select' || source.enum) {
					this.type = 'input:select';
					this.multiple = !!source.multiple;
				} else {
					if(this.format) {
						var formatNoDash = this.format.replace('-', '');
						
						if(format[formatNoDash]) {
							switch(formatNoDash) {
							case 'date':
							case 'datetime':
							case 'time':
								this.type = 'input:' + formatNoDash;
								break;
								
							default:
								this.type = 'input:text';
							}
							
							tv4.addFormat(this.format, format[formatNoDash]);
						} else {
							log.warning(log.codes.FIELD_UNSUPPORTED_FORMAT, { format: this.format, field: this.path });
							this.type = 'input:text';
						}
					} else {
						switch(source.type) {
						case 'any':
						case 'input:any':
							this.type = 'input:any';
							break;
							
						case 'array':
						case 'array:field':
						case 'array:fieldset':
							if(source.items) {
								if(source.items.type == 'object') {
									this.type = 'array:fieldset';
									this.fieldAdd(source.items);
								} else if(source.items.enum) {
									this.enum = source.items.enum;
									this.multiple = true;
									this.type = 'input:select';
								} else if(source.items.allOf) {
									log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, { property: 'allOf', field: this.path });
								} else if(source.items.anyOf) {
									log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, { property: 'anyOf', field: this.path });
								} else if(source.items.oneOf) {
									log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, { property: 'oneOf', field: this.path });
								} else {
									this.type = 'array:field';
									this.fieldAdd(source.items);
								}
								if(source.minItems >= 1) {
									this.required = true;
								}
							} else if(source.fields) {
								this.type = source.type;
								this.fields = source.fields;
							} else {
								log.warning(log.codes.FIELD_MISSING_PROPERTY, { property: 'items', field: this.path });
								this.type = null;
							}
							break;
							
						case 'boolean':
						case 'checkbox':
						case 'input:checkbox':
							this.type = 'input:checkbox';
							break;
							
						case 'input:number':
						case 'integer':
						case 'number':
							this.step = source.step || null;
							this.type = 'input:number';
							break;
							
						case 'input:range':
						case 'range':
							this.step = source.step || null;
							this.type = 'input:range';
							break;
							
						case 'object':
							if(source.properties) {
								this.type = 'object';
								this.fieldAdd(source);
							} else if(source.fields) {
								this.type = 'object';
								this.fields = source.fields;
							} else {
								log.warning(log.codes.FIELD_MISSING_PROPERTY, { property: 'properties', field: this.path });
								this.type = null;
							}
							break;
							
						case 'input:textarea':
						case 'textarea':
							this.type = 'input:textarea';
							break;
							
						case 'input:text':
						case 'string':
						case 'text':
							this.type = 'input:text';
							break;
							
						case undefined:
							this.type = (this.type || 'input:text');
							break;
							
						default:
							log.warning(log.codes.FIELD_UNSUPPORTED_TYPE, { type: source.type, field: this.path });
							this.type = null;
						}
					}
				}
				
				// Set schema pattern if not set and pattern is defined
				if(this.pattern && this.schema && !this.schema.pattern) {
					this.schema.pattern = this.pattern;
				}
				
				// Add one element to arrays which requires at least one element
				if(this.typeOf('array') && this.schema.minItems) {
					if(!this.values) {
						this.itemAdd();
					}
				}
				
				// Automatically hide fields by default if ID starts with underscore
				if((this.id && this.id[0] == '_') && this.hidden !== false) {
					log.debug(log.codes.FIELD_HIDDEN_DEFAULT, { field: this.path });
					this.hidden = true;
				}
				
				this.visible = this.hidden ? false : true;
				
				if(this.value === undefined) {
					if((this.value = source.value) === undefined) {
						if((this.value = this.default) === undefined) {
							this.value = null;
						}
					}
				}
				
				// Ensure array typed default if required
				if(this.default && source.type == 'array') {
					if(!(this.default instanceof Array)) {
						this.default = [ this.default ];
					}
				}
				
				// Set intial value for select fields with no default
				if(this.type == 'input:select' && !this.multiple && (this.value === null)) {
					this.value = this.enum[0];
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
				if(typeof schema == 'object') {
					if(!this.fields) {
						this.fields = [];
					}
					
					var parents = [];
					angular.forEach(this.parents, function(parent) {
						parents.push(parent);
					});
					parents.push({ id: this.id, index: this.index });
					
					if(schema.type == 'object') {
						angular.forEach(schema.properties, function(val, key) {
							var newField = new field(val, key, parents);
							newField.required = (schema.required && schema.required.indexOf(key) != -1);
							
							if(newField.type) {
								newField.index = this.fields.length;
								this.fields.push(newField);
							}
						}, this);
					} else {
						var newField = new field(schema, null, parents);
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
					if(!fieldMatch && field.id == id) {
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
			 */
			
			itemAdd: function() {
				if(this.typeOf('array') && this.fields) {
					if(!this.values) {
						this.values = [];
					}
					
					var parents = [], index;
					angular.forEach(this.parents, function(parent) {
						parents.push(parent);
					});
					parents.push({ id: this.id, index: this.index });
					
					if(this.typeOf('fieldset')) {
						index = this.values.push({ fields: angular.copy(this.fields), visible: true, valid: true }) - 1;
						
						angular.forEach(this.values[index].fields, function(field) {
							field.index = index;
							field.parents = parents;
							field.uidGen();
							field.pathGen();
						});
					} else {
						index = this.values.push(angular.copy(this.fields[0])) - 1;
						var field = this.values[index];
						field.index = index;
						field.parents = parents;
						field.uidGen();
						field.pathGen();
					}
					
					this.validate(true, false);
				}
			},
			
			/**
			 * @method itemIndex
			 * 
			 * Function used to return the fieldset index of a subfield based on ID.
			 * 
			 * @param id Field ID of the subfield as a string
			 */
			
			itemIndex: function(id) {
				for(var index in this.fields) {
					if(this.fields[index].id == id) {
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
				if(this.typeOf('array') && this.values) {
					if(this.values.length > item) {
						this.values.splice(item, 1);
					}
					
					angular.forEach(this.values, function(fs, i) {
						if(this.typeOf('fieldset')) {
							angular.forEach(fs.fields, function(field) {
								field.index = i;
								field.pathGen();
							});
						} else {
							fs.index = i;
							fs.pathGen();
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
				if(this.typeOf('array') && this.values) {
					if(this.values.length > item) {
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
					if(parent.index !== null) {
						this.path += parent.index + '/';
					}
					
					this.path += parent.id + '/';
				}, this);
				
				if(this.index !== null) {
					this.path += this.index;
					
					if(this.id) {
						this.path += '/' + this.id;
					}
				} else if(this.id) {
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
				if(this.type && typeof type == 'string') {
					var types = this.type.split(':'), match = false;
					
					angular.forEach(type.split(' '), function(type) {
						if(!match && type === this.type || type === types[0] || type === types[1]) {
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
				var uid = 'formula-', chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
				
				for(var i = 0; i < (len ? len : 8); ++i) {
					uid += chars[Math.floor(Math.random() * chars.length)];
				}
				
				if(field.uids.indexOf(uid) != -1) {
					return this.uidGen(len);
				} else {
					this.uid = uid;
				}
				
				return uid;
			},
			
			/**
			 * @method validate
			 * 
			 * Function used to validate the field based on its schema.
			 * This function also sets the field error memeber value if the validation fails,
			 * and additionally sets the form valid state if a parent form is specified.
			 * 
			 * @param silent Prevent setting error flags during validation if true
			 * @param form Validate entire form during validation if true
			 * @returns true if the field is valid, otherwise false
			 */
			
			validate: function(silent, form) {
				if(this.schema) {
					var fieldError = null, tempValue, match;
					
					switch(this.type) {
					case 'array:field':
						this.value = [];
						angular.forEach(this.values, function(field) {
							if((field.dirty || field.value !== null) && field.validate()) {
								this.value.push(field.value);
							}
						}, this);
						break;
						
					case 'array:fieldset':
						this.value = [];
						angular.forEach(this.values, function(fieldset, index) {
							this.value.push({});
							fieldset.valid = true;
								
							angular.forEach(fieldset.fields, function(field) {
								if(field.dirty || (field.value !== null) || field.typeOf('array object')) {
									if(field.validate(silent, false)) {
										this.value[index][field.id] = field.value;
									} else fieldset.valid = false;
								} else fieldset.valid = false;
							}, this);
						}, this);
							
						// Remove invalid array elements
						for(var i = 0; i < this.value.length; ++i) {
							if(!tv4.validate([this.value[i]], this.schema)) {
								this.value.splice(i--, 1);
								fieldError = tv4.error;
								continue;
							}
						}
						break;
						
					case 'input:any':
						if(this.value) {
							if(!isNaN(this.value)) {
								tempValue = Number(this.value);
							} else if((match = this.value.match(/^\[(.*)\]$/))) {
								tempValue = [match[1]];
							} else {
								switch(this.value.toLowerCase()) {
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
						if(this.multiple && !this.value) {
							this.value = [];
						} else {
							switch(this.schema.type) {
							case 'integer':
							case 'number':
								this.value = Number(this.value);
								break;
							}
						}
						break;
						
					case 'object':
						this.value = {};
						
						if(this.fields) {
							// Populate value as object of valid fields
							angular.forEach(this.fields, function(field, index) {
								if(field.dirty || field.value !== null || field.typeOf('array object')) {
									if(field.validate(field.dirty ? false : true)) {
										this.value[field.id] = field.value;
									}
								}
							}, this);
						}
						break;
					}
					
					var valid = tv4.validate((tempValue !== undefined ? tempValue : this.value), this.schema);
					
					if(!valid && this.nullable) {
						switch(typeof this.value) {
						case 'string':
							if(!this.value || !this.value.length) {
								this.value = null;
							}
							break;
							
						case 'number':
							if(isNaN(this.value)) {
								this.value = null;
							}
							break;
							
						case 'object':
							var items = 0;
							angular.forEach(this.value, function() { items++; });
							
							if(!items) {
								this.value = null;
							}
							break;
						}
						
						// TODO: Add support for null-types in tv4
						if(this.value === null) {
							fieldError = null;
							valid = true;
						}
					}
					
					if(silent !== true) {
						this.valid = (valid && !fieldError);
						this.error = fieldError ? fieldError.message : (valid ? null : tv4.error.message);
					}
					
					if((form === true) && this.form) {
						this.form.validate(true);
					}
					
					return valid;
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
				if(model[this.id] !== undefined) {
					var i, j;
					
					if(this.type == "object") {
						for(i in this.fields) {
							if(model[this.id][this.fields[i].id]) {
								this.fields[i].value = model[this.id][this.fields[i].id];
							}
						}
					} else if(this.type == "array:fieldset") {
						this.values = [];
						
						for(i in model[this.id]) {
							this.itemAdd();
							
							for(j in this.values[i].fields) {
								this.values[i].fields[j].valueFromModel(model[this.id][i]);
							}
						}
					} else if(this.type == "array:field") {
						this.values = [];
						
						for(i in model[this.id]) {
							this.itemAdd();
							this.values[i].value = model[this.id][i];
						}
					} else {
						this.value = model[this.id];
					}
				}
			}
		};
		
		return field;
	}]);

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
	
	.factory('formulaForm',
	['formulaJsonLoader', 'formulaModel', 'formulaField', 'formulaI18n',
	function(jsonLoader, model, field, i18n) {
		function fieldsetFromSchema(form, schema) {
			if(schema && schema.type == 'object') {
				var fields = [];
				
				angular.forEach(schema.properties, function(val, key) {
					var newField = new field(val, key);
					newField.form = form;
					newField.required = newField.required || (schema.required && schema.required.indexOf(key) != -1);
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
		
		function form(uri) {
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
		
		form.prototype = {
			
			/**
			 * @method activate
			 * 
			 * Function used to activate a specified fieldset.
			 * Useful to hide inactive fieldsets when using a tabbed environment.
			 * 
			 * @param fieldset An object or an index number representing the fieldset
			 */
			
			activate: function(fieldset) {
				angular.forEach(this.fieldsets, function(f, i) {
					if(typeof fieldset == 'object' || typeof fieldset == 'number') {
						if((typeof fieldset == 'object') ? (f === fieldset) : (i === fieldset)) {
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
				if(typeof schema == 'object') {
					var baseForm = fieldsetFromSchema(this, schema);
					baseForm.fieldExtended = function(formField) {
						for(var i = 0; i < this.length; ++i) {
							var obj = (typeof formField == 'object');
							if(this[i].id == (obj ? formField.id : formField)) {
								if(obj) {
									var ret = new field(this[i]);
									return ret.attrsSet(formField);
								}
								return new field(this[i]);
							}
						}
						return null;
					};
					
					if(form && form.fieldsets) {
						this.title = form.title;
						this.fieldsets = [];
						
						angular.forEach(form.fieldsets, function(fs, i) {
							this.fieldsets.push({ title: fs.title, active: (i ? false : true), fields: [] });
							angular.forEach(fs.fields, function(f, j) {
								var field = baseForm.fieldExtended(f);
								if(field) {
									field.form = this;
									this.fieldsets[i].fields.push(field);
								}
							}, this);
						}, this);
					} else {
						this.fieldsets = [{ fields: baseForm, active: true }];
					}
					
					this.schema = schema;
					this.validate(true);
				}
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
				if((validate !== false) && !this.validate()) {
					return;
				}
				
				if(typeof this.onsave == 'function') {
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
					
					if(field.type == 'array:fieldset' || field.type == 'object') {
						angular.forEach(field.fields, function(field) {
							fieldTranslate(field, fieldTranslation);
						});
						
						angular.forEach(field.values, function(fieldset) {
							angular.forEach(fieldset.fields, function(field) {
								fieldTranslate(field, fieldTranslation);
							});
						});
					}
					
					if(fieldTranslation) {
						field.title = fieldTranslation.title || field.title || field.id;
						field.description = fieldTranslation.description || field.description;
						
						if(field.typeOf('select')) {
							field.values = [];
							
							angular.forEach(field.enum, function(key, index) {
								field.values.push({ id: key, label: fieldTranslation.values ? (fieldTranslation.values[index] || key) : key });
							});
						}
					} else {
						field.title = field.title || field.id;
						
						if(field.typeOf('select')) {
							field.values = [];
							
							angular.forEach(field.enum, function(val) {
								field.values.push({ id: val, label: val });
							});
						}
					}
				}
				
				this.i18n = i18n(code);
				
				angular.forEach(this.fieldsets, function(fs, i) {
					if(this.i18n.fieldsets) {
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
			 * @param silent Prevent setting field error flags if true
			 * @returns true if the entire form is valid, otherwise false
			 */
			
			validate: function(silent) {
				var self = this;
				this.errors = [];
				
				function fieldValidate(field) {
					if(field.typeOf('array')) {
						angular.forEach(field.values, function(value) {
							if(field.typeOf('fieldset')) {
								angular.forEach(value.fields, function(field) {
									fieldValidate(field);
								});
							} else {
								fieldValidate(value);
							}
						});
					} else if(field.typeOf('object')) {
						angular.forEach(field.fields, function(subfield) {
							fieldValidate(subfield);
						});
					}
					
					if((field.typeOf('array checkbox object select')) || (field.required || field.dirty || field.value !== null)) {
						// Fields with a default value are always validated verbosely
						if(!field.validate(field.dirty ? false : silent, false)) {
							self.errors.push(field.path + ' (' + tv4.error.message + ')');
							return false;
						}
						
						return true;
					}
					
					return null; // Field not required, or untouched
				}
				
				model.locked = true;
				var tempModel = angular.copy(model.data);
				
				angular.forEach(this.fieldsets, function(fieldset) {
					angular.forEach(fieldset.fields, function(field) {
						var fieldValid = fieldValidate(field);
						
						if(fieldValid !== null) {
							if(fieldValid) {
								model.data[field.id] = field.value;
							} else {
								delete model.data[field.id];
							}
						}
					}, this);
				}, this);
				
				if(angular.equals(tempModel, model.data)) {
					model.locked = false;
				}
				
				if((this.valid = !(this.errors.length))) {
					this.errors = null;
				}
				
				return this.valid;
			}
		};
		
		return form;
	}]);

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
				
				if(typeof data == 'string') {
					// TODO: rgb-colors restricted to values between 0 and 255 (inclusive)
					if(colors.split(',').indexOf(data.toLowerCase()) != -1 || /^(#([a-f0-9]{3}|[a-f0-9]{6})|rgb\(\s?\d{1,3}%?,\s?\d{1,3}%?,\s?\d{1,3}%?\s?\))$/i.test(data)) {
						return null;
					}
					
				}
				
				return 'CSS 2.1 color';
			},
			date:  // ISO 8601 date
			function(data, schema) {
				if(typeof data == 'string' && /^\d{4}(-\d{2}){2}$/.test(data)) {
					return null;
				}
				
				return 'ISO 8601 date';
			},
			datetime: // ISO 8601 datetime combination
			function(data, schema) {
				if(typeof data == 'string' && /^\d{4}(-\d{2}){2}T\d{2}(:\d{2}){2}(.\d+)?(([+-](\d{2}|\d{4}|\d{2}:\d{2}))|Z)$/.test(data)) {
					return null;
				}
				
				return 'ISO 8601 datetime';
			},
			email: // RCF 3696 email
			function(data, schema) {
				var local = /^[-+a-z0-9!#$%&'*=?^_`{|}~\/]([-+a-z0-9!#$%&'*=?^_`{|}~\/]|\.(?!\.)){0,62}[-+a-z0-9!#$%&'*=?^_`{|}~\/]$/i,
					domain = /^[-a-z0-9]([-a-z0-9]|\.(?!\.)){0,253}[-a-z0-9]$/i, // TODO: IPv4 and IPv6 support
					comment = /\(.*\)/g,
					parts = (typeof data == 'string' ? data.split('@') : []);
					
				if(parts.length == 2 && data.length <= 254) {
					if(local.test(parts[0].replace(comment, '')) && domain.test(parts[1].replace(comment, ''))) {
						return null;
					}
				}
				
				return 'RCF 3696 e-mail address';
			},
			time: // ISO 8601 time
			function(data, schema) {
				if(typeof data == 'string' && /^\d{2}(:\d{2}){2}$/.test(data)) {
					return null;
				}
				
				return 'ISO 8601 time';
			},
			uri: // RFC 3986 URI
			function(data, schema) {
				if(typeof data == 'string' && /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i.test(data)) {
					return null;
				}
				
				return 'RFC 3986 URI';
			}
		};
	});

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
				if(!retCode && data.uri == uri) {
					retCode = code;
				}
			});
			
			return retCode;
		};
		
		return i18n;
	}]);

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
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
		return function(uri, jsonp) {
			var deferred = $q.defer();
			
			if(jsonp === undefined) {
				jsonp = (uri.search(/https?:/) === 0);
			}
			
			(jsonp ? $http.jsonp(uri + '?callback=JSON_CALLBACK') : $http.get(uri))
				.success(function(data, status, headers, config) {
					deferred.resolve(data);
				}).error(function(data, status, headers, config) {
					log.error(log.codes.JSON_LOAD_ERROR, { uri: uri });
					deferred.reject(uri);
				});
			return deferred.promise;
		};
	}]);

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
	['$log',
	function($log) {
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
					$log.debug(codeTranslate(msg, params));
				} else {
					$log.debug(msg);
				}
			},
			error: function(code, params) {
				$log.error(codeTranslate(code, params));
			},
			warning: function(code, params) {
				$log.warn(codeTranslate(code, params));
			}
		};
	}]);

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
            locked: false,
            set: function(data) {
                if(!this.locked) {
                    this.data = data;
					return true;
				}
				
				return false;
            }
        };
        
        return model;
	});

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
		
		function schema(uri) {
			this.deferred = null;
			this.json = null;
			this.uri = uri || null;
		}
		
		schema.cache = {};
		
		schema.prototype = {
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
					if(path[0] == '#') {
						path = path.substr(path[1] == '/' ? 2 : 1).split('/');
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
						if(typeof data == 'object') {
							missing = missing.concat(refCompile(data, schemaJson, key));
						} else if(key == '$ref' && parentJson) {
							if(data[0] == '#') {
								if((deref = selfDeref(data))) {
									parentJson[parentKey] = deref;
								} else {
									missing.push(data);
									delete parentJson[parentKey];
								}
							} else {
								if(schema.cache[data] && schema.cache[data].json) {
									parentJson[parentKey] = schema.cache[data].json;
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
				
				if(uri && typeof uri == 'string') {
					if(!schema.cache[uri]) {
						var root = {
							schema: schema.cache[uri] = new schema(uri),
							missing: null,
							resolve: function(uri) {
								if(uri && this.missing instanceof Array) {
									var index = this.missing.indexOf(uri);
									if(index != -1) {
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
									if(!schema.cache[uri]) {
										var ref = new schema();
										ref.deref(uri).then(function() {
											root.resolve(uri);
										});
									} else {
										schema.cache[uri].then(function() {
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
						schema.cache[uri].then(function(data) {
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
						if(typeof data == 'object') {
							var subRefs = refArray(data);
							angular.forEach(subRefs, function(ref) {
								refs.push(ref);
							});
						} else if(key == '$ref' && data[0] != '#') {
							if(!ignoreCached || !schema.cache[data]) {
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
		
		return schema;
	}]);

angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/bootstrap3.html","<form class=\"form-horizontal\" ng-if=\"form.fieldsets\"><header ng-if=\"form.title\" class=\"page-header\" style=\"margin-top: -10px\"><h2>{{ form.title }}</h2></header><ul class=\"nav nav-tabs\"><li ng-repeat=\"fieldset in form.fieldsets\" ng-if=\"form.fieldsets.length > 1\" ng-class=\"{ active: fieldset.active }\"><a href=\"\" ng-click=\"form.activate(fieldset)\">{{ fieldset.title }}</a></li></ul><fieldset ng-repeat=\"fieldset in form.fieldsets\" ng-if=\"fieldset.active\" style=\"border: 1px solid #ddd; border-radius: 0 0 5px 5px; border-top: 0; padding: 15px; padding-bottom: 0;\"><div ng-repeat=\"field in fieldset.fields\" ng-show=\"field.visible\" formula:field-definition=\"\"><div ng-if=\"field.typeOf(\'input\')\" title=\"{{ field.description }}\" class=\"form-group has-feedback\"><label for=\"{{ field.uid }}\" class=\"col-sm-3 control-label\">{{ field.title }}</label><div class=\"col-sm-9\" ng-class=\"{ \'has-error\': field.error, \'has-success\': field.valid, \'has-warning\': (field.required && field.value === null) }\"><div ng-if=\"!field.typeOf(\'select\')\"><input class=\"form-control input-md\" formula:field=\"field\"><div ng-if=\"!field.typeOf(\'checkbox\') && (field.error || field.valid)\"><span ng-if=\"field.valid\" class=\"glyphicon glyphicon-ok form-control-feedback\"></span> <span ng-if=\"field.error\" class=\"glyphicon glyphicon-remove form-control-feedback\"></span></div></div><select ng-if=\"field.typeOf(\'select\')\" class=\"form-control input-md\" formula:field=\"field\"><option ng-repeat=\"value in field.values\" value=\"{{ value.id }}\">{{ value.label }}</option></select><span class=\"help-block\">{{ field.error || field.description }}</span></div></div><div ng-if=\"field.typeOf(\'object\')\"><div class=\"panel\" ng-class=\"{ \'panel-danger\': field.error, \'panel-success\': field.valid }\" formula:field=\"field\"><div class=\"panel-heading\">{{ field.title }}</div><div class=\"panel-body\"><div ng-repeat=\"field in field.fields\" ng-show=\"field.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></div></div></div><div ng-if=\"field.typeOf(\'array\')\"><div formula:field=\"field\"><div ng-if=\"field.typeOf(\'fieldset\')\" class=\"panel\" ng-class=\"{ \'panel-danger\': field.error, \'panel-success\': field.valid }\"><div class=\"panel-heading\">{{ field.title }} ({{ field.values.length || 0 }})</div><ul class=\"list-group\"><li class=\"list-group-item\" ng-repeat=\"value in field.values\"><fieldset><legend style=\"border: none; margin-bottom: 10px; text-align: right;\"><span ng-class=\"{ \'text-danger\': !value.valid, \'text-success\': value.valid }\" class=\"pull-left\" ng-if=\"!value.visible\">{{ value.fields | formulaInlineValues }}</span> <button style=\"font-family: monospace;\" class=\"btn btn-sm btn-info\" ng-click=\"field.itemToggle($index)\" type=\"button\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</button> <button class=\"btn btn-sm btn-danger\" ng-click=\"field.itemRemove($index)\" type=\"button\" title=\"{{ form.i18n.remove[1] }}\">X</button></legend><div ng-repeat=\"subfield in field.fields\" ng-show=\"value.visible\"><formula:field-instance field=\"value.fields[$index]\" ng-show=\"subfield.visible\"></formula:field-instance></div></fieldset></li></ul><div class=\"panel-footer clearfix has-feedback\" ng-class=\"{ \'has-error\': field.error, \'has-success\': field.valid }\"><span class=\"help-block\"><span>{{ field.error || field.description }}</span> <button class=\"btn btn-sm btn-primary pull-right\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\">{{ form.i18n.add[0] }}</button></span></div></div><div ng-if=\"field.typeOf(\'field\')\" class=\"panel\" ng-class=\"{ \'panel-danger\': field.error, \'panel-success\': field.valid }\"><div class=\"panel-heading\">{{ field.title }}</div><ul class=\"list-group\"><li class=\"list-group-item\" ng-repeat=\"value in field.values\"><div class=\"input-group\"><input formula:field=\"value\" class=\"form-control input-md\"> <span class=\"input-group-btn\"><button class=\"btn btn-danger\" ng-click=\"field.itemRemove($index)\" type=\"button\" title=\"{{ form.i18n.remove[1] }}\">X</button></span></div></li></ul><div class=\"panel-footer clearfix has-feedback\" ng-class=\"{ \'has-error\': field.error, \'has-success\': field.valid }\"><span class=\"help-block\"><span>{{ field.error || field.description }}</span> <button class=\"btn btn-sm btn-primary pull-right\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\">{{ form.i18n.add[0] }}</button></span></div></div></div></div></div></fieldset><div class=\"has-feedback\" ng-class=\"{ \'has-error\': !form.valid, \'has-success\': form.valid }\" style=\"margin-top: 10px;\"><span class=\"help-block\"><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span><div class=\"btn-group pull-right\"><button ng-if=\"!form.uiValidateHidden\" type=\"button\" class=\"btn btn-info\" ng-click=\"form.validate()\" title=\"{{ form.i18n.validate[1] }}\">{{ form.i18n.validate[0] }}</button> <button ng-if=\"!form.uiSaveHidden\" type=\"button\" class=\"btn btn-success\" ng-class=\"{ disabled: !form.valid }\" ng-click=\"form.save()\" title=\"{{ form.i18n.save[1] }}\">{{ form.i18n.save[0] }}</button></div></span></div></form><div ng-if=\"!form.fieldsets\" class=\"alert alert-info\" style=\"text-align: center; overflow: hidden;\"><span>Loading schema...</span></div>");
$templateCache.put("formula/default.html","<form class=\"formula\" ng-if=\"form.fieldsets\"><header ng-if=\"form.title\">{{ form.title }}</header><nav ng-if=\"form.fieldsets.length > 1\"><a ng-repeat=\"fieldset in form.fieldsets\" ng-class=\"{ active: fieldset.active }\" href=\"\" ng-click=\"form.activate(fieldset)\">{{ fieldset.title }}</a></nav><fieldset ng-repeat=\"fieldset in form.fieldsets\" ng-if=\"fieldset.active\"><legend ng-if=\"fieldset.title\">{{ fieldset.title }}</legend><div ng-repeat=\"field in fieldset.fields\" ng-show=\"field.visible\" formula:field-definition=\"\"><div ng-if=\"field.typeOf(\'input\')\" title=\"{{ field.description }}\" ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value === null) }\"><label for=\"{{ field.uid }}\">{{ field.title }}</label> <input formula:field=\"field\"> <span>{{ field.error || field.description }}</span></div><div ng-if=\"field.typeOf(\'object\')\"><fieldset formula:field=\"field\"><legend>{{ field.title }}</legend><div ng-repeat=\"field in field.fields\" ng-show=\"field.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></fieldset></div><div ng-if=\"field.typeOf(\'array\')\"><div formula:field=\"field\"><fieldset ng-class=\"{ valid: field.valid, error: field.error }\"><legend>{{ field.title }} ({{ field.values.length || 0 }})</legend><ul ng-if=\"field.typeOf(\'fieldset\')\"><li ng-repeat=\"value in field.values\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.fields | formulaInlineValues }}</span> <a href=\"\" class=\"toggle\" ng-click=\"field.itemToggle($index)\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a href=\"\" class=\"remove\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></legend><div ng-repeat=\"subfield in field.fields\" ng-show=\"value.visible\"><formula:field-instance field=\"value.fields[$index]\" ng-show=\"subfield.visible\"></formula:field-instance></div></fieldset></li><li><span>{{ field.error || field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul><ul ng-if=\"field.typeOf(\'field\')\"><li ng-repeat=\"value in field.values\" ng-class=\"{ valid: value.valid, error: value.error }\"><input formula:field=\"value\"> <a href=\"\" class=\"remove\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a> <span ng-if=\"value.error\">{{ value.error }}</span></li><li><span>{{ field.error || field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" type=\"button\" title=\"{{ form.i18n.add[1] }}\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul></fieldset></div></div></div></fieldset><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-if=\"!form.uiValidateHidden\" ng-click=\"form.validate()\" title=\"{{ form.i18n.validate[1] }}\"><strong>&#10003;</strong> {{ form.i18n.validate[0] }}</button> <button ng-if=\"!form.uiSaveHidden\" ng-disabled=\"!form.valid\" ng-click=\"form.save()\" title=\"{{ form.i18n.save[1] }}\"><strong>&#9921;</strong> {{ form.i18n.save[0] }}</button></footer></form><div class=\"formula\" ng-if=\"!form.fieldsets\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div>");}]);;