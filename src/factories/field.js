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
