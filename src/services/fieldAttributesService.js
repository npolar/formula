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
