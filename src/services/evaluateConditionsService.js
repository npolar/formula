/* globals angular */
angular.module('formula').service('formulaEvaluateConditionsService', ['$rootScope',
  function($rootScope) {
    "use strict";

    var keepFailing = true;

    var evaluateConditions = function(form) {
      var model = {};
      form.fieldsets.forEach(function(fieldset) {
        fieldset.fields.forEach(function(field) {
          model[field.id] = field.value;
        });
      });
      form.fields().forEach(function(field) {
        evaluateField(field, model);
      });
    };

    var evaluateField = function(field, model) {
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

            pass = $rootScope.$eval(cond, model);
          }
        });

        field.visible = field.hidden ? false : pass;

        if (!keepFailing) {
          if (pass) {
            field.value = field.backupValue || field.value;
          } else {
            field.backupValue = field.value;
            field.value = undefined;
          }
        }
      }
    };

    return {
      evaluateConditions: evaluateConditions,
      setKeepFailing: function(val) {
        keepFailing = val;
      }
    };
  }
]);
