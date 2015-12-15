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

.factory('formulaField', ['$filter', 'formulaLog', 'formulaFormat', 'formulaAutoCompleteService', 'formulaCustomTemplateService',
  function($filter, log, format, formulaAutoCompleteService, formulaCustomTemplateService) {
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

    var setArrayFieldTypes = function(field, source) {
      if (source.type instanceof Array) {
        field.nullable = source.type.some(function(type) {
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

    var setFieldType = function(field, source) {
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

    var applyFormDefinition = function(field, source) {
      if (field.fields && source.fields) {
        // Update field properties based on form specification
        if (field.typeOf('fieldset')) {
          field.fields.forEach(function(subfield) {
            return applyFormDefinition(subfield, source);
          });
        }

        var fieldMatch;
        source.fields.forEach(function(fieldDefinition) {
          if (typeof fieldDefinition === 'object') {
            fieldMatch = field.fieldFromID(fieldDefinition.id);
            if (fieldMatch) {
              fieldMatch.attrsSet(fieldDefinition);
            }
          } else if (typeof fieldDefinition === 'string' && fieldDefinition.charAt(0) === "!") {
            field.fields.forEach(function (subfield, index) {
              if (subfield.id === fieldDefinition.slice(1)) {
                field.fields.splice(index, 1);
              }
            });
          }
        });
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
       * @param templates Optional custom templates
       * @returns The updated field instance
       */

      attrsSet: function(source, templates) {
        var attribs = 'autocomplete,condition,default,description,disabled,enum,format,hidden,maximum,maxLength,minimum,minLength,multiple,pattern,readonly,required,step,title,values'.split(',');
        angular.forEach(source, function(v, k) {
          if (attribs.indexOf(k) !== -1) {
            this[k] = v;
          }
        }, this);

        translateDefaultValues(this);
        applyFormDefinition(this, source);
        setArrayFieldTypes(this, source);
        setFieldType(this, source);
        formulaCustomTemplateService.initField(this);

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
              newField.index = this.fields.length;

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
          var parents = [],
            index;
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

          this.error = !this.valid ? tv4.error.message : null;
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
          formulaCustomTemplateService.initField(this);
          this.validate(false);
        }
      },

      nrArrayValues: function() {
        if (this.values) {
          return this.values.reduce(function(memo, value) {
            return memo + (value.hidden ? 0 : 1);
          }, 0);
        }
      }
    };

    return Field;
  }
]);
