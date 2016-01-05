"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaEvaluateConditionsService', ['$rootScope', 'formulaModel',
    function($rootScope, model) {
      var evaluateConditions = function(field) {
        // Evaluate condition
        if (field.condition) {
          var pass = true,
            condition = (field.condition instanceof Array ? field.condition : [field.condition]);

          angular.forEach(condition, function(cond) {
            var local = model.data,
              parents = field.parents,
              pathSplitted;
              console.log('ec', local, parents);
            if (pass) {
              // Absolute JSON path
              if (cond[0] === '#') {
                parents = [];

                // Slash-delimited resolution
                if (cond[1] === '/') {
                  pathSplitted = cond.substr(1).split('/');
                }

                // Dot-delimited resolution
                else {
                  pathSplitted = cond.substr(1).split('.');
                  if (!pathSplitted[0].length) {
                    parents.splice(0, 1);
                  }
                }

                angular.forEach(pathSplitted, function(split, index) {
                  if (isNaN(split)) {
                    parents.push({
                      id: split,
                      index: null
                    });
                  } else if (index > 0) {
                    parents[index - 1].index = Number(split);
                  }
                });

                cond = parents[parents.length - 1].id;
                parents.splice(parents.length - 1, 1);
              }

              angular.forEach(parents, function(parent) {
                if (local) {
                  local = (parent.index !== null ? local[parent.index][parent.id] : local[parent.id]);
                }
              });

              if (local && field.index !== null) {
                local = local[field.index];
              }

              console.log('evaluateConditions', field.id, cond, local);

              var evaluate = $rootScope.$eval(cond, local);
              if (!local || evaluate === undefined || evaluate === false) {
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
