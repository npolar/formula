"use strict";
/* globals angular */

(function() {


  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */
  angular.module('formula')
    .directive('formulaField', ['$compile', '$q', 'formulaModel', 'formulaCustomTemplateService',
    'formulaEvaluateConditionsService',
      function($compile, $q, model, formulaCustomTemplateService, formulaEvaluateConditionsService) {

        var getInputElement = function (attrs, element, field, type) {
          var elem;
          switch (type.sub) {
            case 'textarea':
              elem = angular.element('<textarea>');
              break;

            case 'select':
              elem = angular.element('<select>');

              if (element.children().length) {
                angular.forEach(element.children(), function(child) {
                  elem.append(child);
                });
              } else {
                elem.attr('ng-options', 'value.id as value.label for value in field.values');
              }

              if (field.multiple) {
                elem.attr('multiple', 'multiple');
              }
              break;

            default:
              elem = angular.element('<input>');
              elem.attr('type', type.sub);

              switch (type.sub) {
                case 'number':
                case 'range':
                  if (field.step !== null) {
                    elem.attr('step', field.step);
                  }
                  break;

                case 'any':
                case 'date':
                case 'datetime':
                case 'time':
                  elem.attr('type', 'text');
                  break;
              }
          }

          angular.forEach(attrs, function(val, key) {
            if (attrs.$attr[key]) {
              elem.attr(attrs.$attr[key], val);
            }
          });

          return elem;
        };


        var getType = function (field) {
          var type = field.type ? field.type.split(':') : null;
          type = type ? {
            main: type[0],
            sub: type[1]
          } : null;
          return type;
        };


        var setAttrs = function (field, attrs) {
          attrs.$set('id', field.uid);
          attrs.$set('ngModel', 'field.value');
          attrs.$set('formulaField'); // unset

          if (field.disabled) {
            attrs.$set('disabled', 'disabled');
          }

          if (field.readonly) {
            attrs.$set('readonly', 'readonly');
          }
        };

        var initScope = function (scope, controllers) {
          scope.form = controllers[0].form;
          scope.backupValue = null;

          if (controllers[1]) {
            scope.field = controllers[1].field;
          }
        };

        // Add class based on field parents and ID
        var addPathClass = function (field, elem) {
          var path = 'formula-';

          angular.forEach(field.parents, function(parent) {
            path += parent.id + '/';
          });

          if (field.id) {
            path += field.id;
          } else if (field.parents) {
            path = path.substr(0, path.length - 1);
          }

          elem.addClass(path);
        };

        // Add css class of schema type
        var addSchemaClass = function (field, elem) {
          var schemaType = field.schema.type;
          if (schemaType) {
            elem.addClass(
              "formula" +
              schemaType.charAt(0).toUpperCase() +
              schemaType.slice(1)
            );
          }
        };

        var getElement = function (attrs, element, field, controllers) {
          var deferred = $q.defer();
          var type = getType(field);
          formulaCustomTemplateService.getCustomTemplate(controllers[0].data.templates, field)
          .then(
            // custom template
            function (template) {
              var elem = angular.element(template);
              elem.addClass('formulaCustomObject');
              deferred.resolve(elem);
          },

          // no custom template
          function () {
            if (type.main === 'input') {
              deferred.resolve(getInputElement(attrs, element, field, type));
            } else {
              deferred.resolve(angular.element(element));
            }
          });

          return deferred.promise;
        };

        var watchFields = function (scope, field) {
          var type = getType(field);
          if (type.main === 'input') {
            scope.$watch('field.value', function(n, o) {
              if (n !== o && scope.form) {
                field.dirty = true;
                field.parents.forEach(function (parent) {
                  parent.dirty = true;
                });
                scope.form.validate();
              }
            });
          }
        };

        return {
          restrict: 'A',
          require: ['^formula', '?^formulaFieldInstance'],
          scope: {
            field: '=formulaField'
          },
          link: function(scope, element, attrs, controllers) {
            var field = scope.field;

            initScope(scope, controllers);
            setAttrs(field, attrs);

            getElement(attrs, element, field, controllers).then(function (elem) {
              addPathClass(field, elem);
              addSchemaClass(field, elem);

              $compile(elem)(scope, function(cloned, scope) {
                element.replaceWith(cloned);
              });
            });

            watchFields(scope, field);

            formulaEvaluateConditionsService.evaluateConditions(scope, field);
          },
          terminal: true
        };
      }
    ]);

})();
