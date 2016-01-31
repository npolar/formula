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
	.directive('formula',
	['$compile', '$timeout', 'formulaI18n', 'formulaClassService',
	function($compile, $timeout, i18n, formulaClassService) {
		return {
			restrict: 'AE',
      scope: { options: '=' },
			controller: ['$scope', function($scope) {
				if(!$scope.options) {
					throw "No formula options provided!";
				}
				var controller = {
					setLanguage: function (uri) {
						var code = i18n.code(uri);
						$scope.language = { uri: uri, code: code };
						if(!code) {
							i18n.add(uri).then(function (code) {
								$scope.language.code = code;

								if ($scope.form) {
									$scope.form.translate(code);
								}
							});
						}
						$timeout();
					},

					setForm: function (form) {
						$scope.form = this.form = form;
					},

					updateTemplates: function () {
						if (this.form) {
							this.form.updateTemplates();
							$timeout();
						}
					}
				};

				controller.setForm($scope.options.form);

				if ($scope.options.language) {
					controller.setLanguage($scope.options.language);
				}

				$scope.options.controller = controller;
			}],
			link: function(scope, iElement, iAttrs) {
				scope.$watch('form', function (form) {
					if (form) {
						iElement.addClass(formulaClassService.schemaClass(form));
						iElement.html(form.template);
						$compile(iElement.contents())(scope);
					}
				});
			}
		};
	}]);

})();
