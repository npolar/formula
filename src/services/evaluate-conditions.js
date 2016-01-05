"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 *
*/
angular.module('formula')
  .service('formulaEvaluateConditionsService', ['$rootScope', 'formulaModel',
    function($rootScope, model) {
      var evaluateConditions = function(field) {

        // Evaluate condition
        if (field.condition) {
          var pass = true,
            condition = (field.condition instanceof Array ? field.condition : [field.condition]);

          // jshint -W116
          angular.forEach(condition, function(cond) {
            if (pass) {
              // Relative path
              if (cond[0] !== '#') {
                cond = field.path.substr(0, field.path.lastIndexOf('/')+1) + cond;
              }
              // Absolute JSON path
              cond = cond.substr(2);
              cond = cond.replace(/\/(\d+)/g, '[$1]');
              cond = cond.replace(/\//g, '.');
              cond = cond.replace('=', '==').replace('===', '==');

              var evaluate = $rootScope.$eval(cond, model.data);
              console.log('evaluateConditions', field.path, cond, model.data, evaluate);
              if (!model.data || evaluate === undefined || evaluate === false) {
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
