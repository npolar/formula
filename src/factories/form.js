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
