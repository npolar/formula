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
  .service('formulaFieldValueFromModelService', ['formulaCustomTemplateService',
    function(formulaCustomTemplateService) {
      var valueFromModel = function (field, model) {
        if (model[field.id] !== undefined) {

          if (field.type === "object") {
            field.fields.forEach(function(fc, index) {
              if (model[field.id][fc.id] !== undefined) {
                valueFromModel(fc, model[field.id]);
              }
            });
          } else if (field.typeOf("array")) {
            field.values = [];
            model[field.id].forEach(function(item, index) {
              var newField;
              if (field.typeOf('fieldset')) {
                newField = field.itemAdd(true /* preventValidation */);
                if (newField.index !== 0) {
                  newField.visible = false;
                }
                if (newField) {
                  var valueModel = {};
                  valueModel[field.values[index].id] = item;
                  valueFromModel(field.values[index], valueModel);
                }
              } else if (field.typeOf('field')) {
                newField = field.itemAdd(true /* preventValidation */);
                if (newField) {
                  field.values[index].value = item;
                }
              } else {
                // @TODO Support array:array
                // jshint -W035
              }
            }, field);
          }

          if (field.value !== model[field.id]) {
            field.value = model[field.id];
            field.dirty = true;
            formulaCustomTemplateService.initField(field);
          }
        }
      };

      return {
        valueFromModel: valueFromModel
      };
    }]);

})();
