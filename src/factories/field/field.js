/* globals angular */
angular.module('formula').factory('formulaField', ['$filter', '$injector', 'formulaLog', 'formulaI18n', 'formulaTemplateService', 'formulaFieldValidateService',
  function($filter, $injector, log, i18n, formulaTemplateService, formulaFieldValidateService) {
    "use strict";

    var fieldBuilder;

    var validateFieldId = function(field) {
      ['.', '/', '#'].forEach(function(invalidChar) {
        if (this.id && this.id.indexOf(invalidChar) >= 0) {
          log.warning(log.codes.FIELD_INVALID_ID, {
            character: invalidChar,
            field: this.path
          });
        }
      }, field);
    };

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

    var Field = {
      create: function(options) {
        var field = Object.create(Field.prototype);
        field.parents = options.parents || [];
        field.id = options.id;
        field.title = options.id.replace(/_/g, ' ');
        field.index = options.index;

        assign(field, (field.schema = options.schema));
        assign(field, (field.fieldDefinition = options.fieldDefinition || {}));
        if (field.schema.items && field.fieldDefinition.fields) {
          assign(field.items, field.fieldDefinition.fields[0]);
        }
        validateFieldId(field);

        field.uidGen();

        reduceFieldTypes(field);

        return field;
      },
      fieldBuilder: fieldBuilder
    };

    Field.uids = [];

    Field.prototype = {
      dirtyParents: function() {
        for (var i = this.parents.length - 1; i >= 0; i--) {
          this.parents[i].dirty = true;
          this.parents[i].itemChange(this);
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
        var genFieldPath = function(field) {
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

      valueFromModel: function(model) {
        if (model[this.id] !== undefined && this.value !== model[this.id]) {
          this.value = model[this.id];
          this.dirty = true;
          formulaTemplateService.initNode(this);
        }
      },

      setRequired: function(required) {
        this.required = (required === true) || (required instanceof Array && required.indexOf(this.id) !== -1);
      },

      getErrorText: function(error) {
        var text = '';
        if (error.dataPath) {
          var item = Number(error.dataPath.replace(/^\/(\d+).*$/, '$1')) + 1;
          text += $filter('formulaReplace')(i18n.text.item, {
            item: item,
            error: error.message
          });
        } else {
          text += error.message;
        }
        return text;
      }
    };

    return Field;
  }
]);
