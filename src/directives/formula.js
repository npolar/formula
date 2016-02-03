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
    .directive('formula', ['$compile', '$timeout', 'formulaI18n', 'formulaClassService',
      function($compile, $timeout, i18n, formulaClassService) {
        return {
          restrict: 'AE',
          scope: {
            options: '='
          },
          controller: ['$scope', function($scope) {
            if (!$scope.options) {
              throw "No formula options provided!";
            }

            var controller = {
              setLanguage: function(code) {
                $scope.language = code;
                if (this.form) {
                  this.form.translate();
                }
              },

              setForm: function(form) {
                $scope.form = this.form = form;
              },

              updateTemplates: function() {
                if (this.form) {
                  this.form.updateTemplates();
                  $timeout();
                }
              },

              updateTemplate: function(template) {
                if (this.form) {
                  this.form.updateTemplate(template);
                  $timeout();
                }
              }
            };

            controller.setForm($scope.options.form);
            controller.setLanguage(i18n.code);

            $scope.options.controller = controller;
            $scope.i18n = i18n;
          }],
          link: function(scope, iElement, iAttrs) {
            scope.$watch('form', function(form) {
              if (form) {
                iElement.addClass(formulaClassService.schemaClass(form));
                iElement.html(form.template);
                $compile(iElement.contents())(scope);

								// http://stackoverflow.com/a/19686824/1357822
                var to;
                var listener = scope.$watch(function() {
                  clearTimeout(to);
                  to = setTimeout(function() {
                    listener();
                    $timeout(function() {
                      scope.form.ready = true;
                    }, 100);
                  }, 50);
                });
              }
            });
          }
        };
      }
    ]);

})();
