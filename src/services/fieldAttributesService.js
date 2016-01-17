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
        if (field.schema.required && field.schema.required.indexOf(field.id) !== -1) {
          field.required = true;
        } else {
          field.required = false;
          field.schema.required = undefined;
        }

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
