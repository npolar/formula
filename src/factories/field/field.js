/* globals angular */
angular.module('formula').factory('formulaField', ['$q', '$filter', '$rootScope', 'formulaLog', 'formulaI18n', 'formulaTemplateService', 'formulaFieldValidateService',
  function($q, $filter, $rootScope, log, i18n, formulaTemplateService, formulaFieldValidateService) {
    "use strict";

    var fieldBuilder;
    var nextUid = 1;

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
        var attribs = 'condition,default,description,disabled,enum,format,hidden,instance,maximum,maxLength,minimum,minLength,multiple,nullable,pattern,readonly,required,step,title,type,values'.split(',');
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

    var uidGen = function (field) {
      var uid = 'formula-' + ('00000' + (nextUid++).toString(16)).slice(-5);
      return (field.uid = uid);
    };

    var Field = {
      create: function(options) {
        var field = Object.create(Field.prototype);
        field.parents = options.parents || [];
        field.id = options.id;
        field.title = options.id.replace(/_/g, ' ');
        field.index = options.index;

        field._elem_q = $q.defer();

        assign(field, (field.schema = options.schema));
        assign(field, (field.fieldDefinition = options.fieldDefinition || {}));

        validateFieldId(field);
        uidGen(field);
        reduceFieldTypes(field);

        return field;
      },
      fieldBuilder: fieldBuilder
    };

    Field.prototype = {
      get element() {
        return this._elem_q.promise;
      },

      get path() {
        var path = '#';

        // jshint -W116
        var genFieldPath = function(field) {
          var path = '/';

          // jshint -W041
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

      isEmpty: function() {
        // jshint -W041,-W116
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

      valueFromModel: function(model, validate) {
        if (model[this.id] !== undefined && this.value !== model[this.id]) {
          this.value = model[this.id];
          this.dirty = true;

          this.updateParent();

          formulaTemplateService.initNode(this);
          if (validate) {
            $rootScope.$emit('revalidate');
          }
        }
      },

      setRequired: function(required) {
        this.required = (required === true) || (required instanceof Array && required.indexOf(this.id) !== -1);
      },

      translate: function(translations) {
        this.title = translations.title || this.title;
        this.description = translations.description || this.description;
      },

      getErrorText: function(error) {
        var text = '';
        error = error || this.error;
        if (!error) {
          return text;
        }
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
      },

      destroy: function() {
        if (typeof this.destroyWatcher === 'function') {
          this.destroyWatcher();
        }
      },

      updateParent: function () {
        var parent;
        if ((parent = this.parents[this.parents.length - 1])) {
          parent.itemChange(this);
        }
      }
    };

    return Field;
  }
]);
