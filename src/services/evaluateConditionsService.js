/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 *
 */
angular.module('formula')
  .service('formulaEvaluateConditionsService', ['$rootScope',
    function($rootScope) {
      var values = {};
      var evaluateConditions = function (form) {
        form.fieldsets.forEach(function (fieldset) {
          fieldset.fields.forEach(function (field) {
            values[field.id] = field.value;
            evaluateField(field);
          });
        });
      };

      var evaluateField = function (field) {
        if (field.typeOf('array')) {
          field.values.forEach(function (value) {
            evaluateField(value);
          });
        } else if (field.typeOf('object')) {
          field.fields.forEach(function (subfield) {
            evaluateField(subfield);
          });
        }

        // Evaluate condition
        if (field.condition) {
          var pass = true,
            condition = (field.condition instanceof Array ? field.condition : [field.condition]);

          // jshint -W116
          condition.forEach(function(cond) {
            if (pass) {
              // Relative path
              if (cond[0] !== '#') {
                cond = field.path.substr(0, field.path.lastIndexOf('/') + 1) + cond;
              }
              // Absolute JSON path
              cond = cond.substr(2);
              cond = cond.replace(/\/(\d+)/g, '[$1]');
              cond = cond.replace(/\//g, '.');
              // Disable setters
              cond = cond.replace('=', '==').replace('===', '==');

              var evaluate = $rootScope.$eval(cond, values);

              if (!values || evaluate === undefined || evaluate === false) {
                pass = false;
              }
            }
          });

          if (field.visible !== (field.visible = field.hidden ? false : pass)) {
            var currentValue = field.value;
            field.value = field.backupValue;
            field.backupValue = currentValue;
          }
        }
      };

      return {
        evaluateConditions: evaluateConditions
      };
    }
  ]);

})();
