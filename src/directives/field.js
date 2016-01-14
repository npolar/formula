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
    .directive('formulaField', ['$compile', '$q',
      function($compile, $q) {

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

          if (type.sub === 'autocomplete') {
            var list = angular.element('<datalist>');
            var id = field.id + '_list';
            elem = angular.element('<input>');
            elem.attr('list', id);
            list.attr('id', id);
            field.querySearch('').then(function(matches) {
              matches.forEach(function(item) {
                var opt = angular.element('<option>');
                opt.attr('value', item);
                list.append(opt);
              });
            });
            list.on('change', field.onSelect);
            elem.append(list);
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

        // Add class based on field parents and ID
        var addPathClass = function(field, elem) {
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
        var addSchemaClass = function(field, elem) {
          var schemaType = field.mainType;
          if (schemaType) {
            elem.addClass(
              "formula" +
              schemaType.charAt(0).toUpperCase() +
              schemaType.slice(1)
            );
          }
        };

        var getElement = function(scope, element, attrs, controllers) {
          var field = scope.field;
          var type = getType(field);
          var elem;

          if (field.customTemplate) {
            elem = angular.element(field.customTemplate);
            elem.addClass('formulaCustomObject');
          } else if (type.main === 'input') {
            elem = getInputElement(field, type, element);
          }

          if (elem) {
            angular.forEach(attrs, function(val, key) {
              if (attrs.$attr[key]) {
                elem.attr(attrs.$attr[key], val);
              }
            });
          } else {
            elem = element;
          }

          return elem;
        };

        return {
          restrict: 'A',
          require: ['^formula', '?^formulaFieldInstance'],
          scope: {
            field: '=formulaField'
          },
          compile: function (tElement, tAttrs, transclude) {
            setAttrs(tAttrs);

            return function link(scope, iElement, iAttrs, controllers) {
              iAttrs.$set('formulaField'); // unset
              var field = scope.field;

              var elem = getElement(scope, iElement, iAttrs, controllers);

              addPathClass(field, elem);
              addSchemaClass(field, elem);

              $compile(elem)(scope, function(cloned, scope) {
                iElement.replaceWith(cloned);
              });
            };
          },
          terminal: true
        };
      }
    ]);

})();
