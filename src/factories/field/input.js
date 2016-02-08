/* globals angular */
angular.module('formula').factory('formulaInputField', ['$rootScope', 'formulaLog', 'formulaField', 'formulaFieldTranslateDefaultsService',
  'formulaInputFieldTypeService', 'formulaTemplateService',
  function($rootScope, log, formulaField, formulaFieldTranslateDefaultsService,
    formulaInputFieldTypeService, formulaTemplateService) {
    "use strict";

    var applyDefaultValue = function(field) {
      if (field.default !== undefined) {
        field.value = field.default;
      } else if (field.typeOf('select') && !field.multiple) {
        field.value = field.enum[0];
      }
    };

    var watchField = function(field) {
      field.destroyWatcher = $rootScope.$watch(function fieldWatch() {
        return field.value;
      }, function(n, o) {
        if (!angular.equals(n, o)) {
          if (field.value === null || field.value === "") {
            field.value = undefined;
            return; // triggers new watch
          }
          field.dirty = true;
          for (var i = field.parents.length - 1; i >= 0; i--) {
            field.parents[i].dirty = true;
            field.parents[i].itemChange(field);
          }
          $rootScope.$emit('revalidate');
        }
      });
    };

    var InputField = {
      create: function(options) {
        var field = Object.create(formulaField.create(options));
        angular.extend(field, InputField.prototype);
        formulaInputFieldTypeService.applyType(field);
        if (!field.type) {
          return;
        }
        formulaFieldTranslateDefaultsService.translateDefaultValues(field);
        applyDefaultValue(field);

        // Set schema pattern if not set and pattern is defined
        if (field.pattern && !field.schema.pattern) {
          field.schema.pattern = field.pattern;
        }

        // Automatically hide fields by default if ID starts with underscore
        if ((field.id && field.id[0] === '_') && field.hidden !== false) {
          log.debug(log.codes.FIELD_HIDDEN_DEFAULT, {
            field: field.path
          });
          field.hidden = true;
        }

        formulaTemplateService.initNode(field);

        field.visible = field.hidden ? false : true;

        watchField(field);
        return field;
      }
    };


    InputField.prototype = {

    };

    return InputField;
  }
]);
