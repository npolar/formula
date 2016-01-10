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

        var getInputElement = function(scope, element, attrs) {
          var elem;
          var field = scope.field;
          var type = getType(field);
          var deferred = $q.defer();
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
              deferred.resolve(elem);
            });
            list.on('change', field.onSelect);
            elem.append(list);
          } else {
            deferred.resolve(elem);
          }

          return deferred.promise;
        };


        var getType = function(field) {
          var type = field.type ? field.type.split(':') : null;
          type = type ? {
            main: type[0],
            sub: type[1]
          } : null;
          return type;
        };


        var setAttrs = function(field, attrs) {
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

        var initScope = function(scope, controllers) {
          scope.form = controllers[0].data.formula;

          if (controllers[1]) {
            scope.field = controllers[1].field;
          }
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
          var deferred = $q.defer();
          var field = scope.field;
          var type = getType(field);

          if (field.customTemplate) {
            var elem = angular.element(field.customTemplate);
            elem.addClass('formulaCustomObject');
            deferred.resolve(elem);
          } else if (type.main === 'input') {
            getInputElement(scope, element, attrs, type).then(function(elem) {
              deferred.resolve(elem);
            });
          } else {
            deferred.resolve(angular.element(element));
          }

          return deferred.promise;
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

            getElement(scope, element, attrs, controllers).then(function(elem) {
              addPathClass(field, elem);
              addSchemaClass(field, elem);

              $compile(elem)(scope, function(cloned, scope) {
                element.replaceWith(cloned);
              });
            });
          },
          terminal: true
        };
      }
    ]);

})();
