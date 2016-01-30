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
    .directive('formulaInput', ['$compile',
      function($compile) {

        var getInputElement = function(field, type, element) {
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

          return elem;
        };


        var getType = function(field) {
          var type = field.type ? field.type.split(':') : null;
          type = type ? {
            main: type[0],
            sub: type[1]
          } : null;
          return type;
        };


        var setAttrs = function(attrs) {
          attrs.$set('id', '{{field.uid}}');
          attrs.$set('ngModel', 'field.value');
          attrs.$set('ng-disabled', 'field.disabled');
          attrs.$set('ng-readonly', 'field.readonly');
        };

        var getElement = function(scope, element, attrs) {
          var field = scope.field;
          var type = getType(field);
          var elem = getInputElement(field, type, element);

          angular.forEach(attrs, function(val, key) {
            if (attrs.$attr[key]) {
              elem.attr(attrs.$attr[key], val);
            }
          });
          return elem;
        };

        return {
          restrict: 'AE',
          scope: {
            field: '='
          },
          compile: function (tElement, tAttrs, transclude) {

            return function link(scope, iElement, iAttrs) {
              setAttrs(iAttrs);
              var elem = getElement(scope, iElement, iAttrs);
              elem.removeAttr('formula:input');
              $compile(elem)(scope, function(cloned, scope) {
                iElement.replaceWith(cloned);
              });
            };
          }
        };
      }
    ]);

})();
