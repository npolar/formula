"use strict";
/* globals angular */

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

              if (field.typeOf('fieldset')) {
                field.itemAdd();
                var valueModel = {};
                valueModel[field.values[index].id] = item;
                valueFromModel(field.values[index], valueModel);
              } else if (field.typeOf('field')) {
                field.itemAdd();
                field.values[index].value = item;
              } else {
                // @TODO Support array:array
                // jshint -W035
              }
            }, field);
          }
          field.value = model[field.id];
          field.dirty = true;
          formulaCustomTemplateService.initField(field);
        }
      };

      return {
        valueFromModel: valueFromModel
      };
    }]);
