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
	.directive('formula',
	['formulaJsonLoader', 'formulaModel', 'formulaSchema', 'formulaForm', 'formulaI18n', '$http', '$compile', '$templateCache', '$templateRequest', '$q',
	function(jsonLoader, model, Schema, Form, i18n, $http, $compile, $templateCache, $templateRequest, $q) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				var controller = this, formBuffer = { pending: false, data: null };

				if(!$scope.data) {
					$scope.data = {};
				}

				if($scope.data.model) {
					model.data = $scope.data.model;
				}

				controller.schema	= $scope.schema = new Schema();
				controller.form  	= $scope.form = new Form();

				$scope.onsave		= $scope.form.onsave;
				$scope.template 	= $scope.data.template || 'default';
				$scope.language 	= { uri: $scope.data.language || null, code: null };

				function formBuild(formURI) {
					if(!formBuffer.pending || formURI) {
						$scope.schema.then(function(schemaData) {
							if(schemaData) {
								formBuffer.pending = false;
								controller.form = $scope.form = $scope.data.formula = new Form(formURI);
								$scope.form.onsave = $scope.onsave;
								$scope.form.build(schemaData, formBuffer.data);
								$scope.form.translate($scope.language.code);
							}
						});
					}
				}

				function loadTemplate (templateId) {
					return $q(function(resolve, reject) {
						var prefix = 'formula/';
						var defaultTemplate = 'default.html';
						var templateCahceKey, templateElement;

						templateId = templateId || defaultTemplate;

						if (templateId.substr(-5) !== '.html') {
							templateId += '.html';
						}

						templateCahceKey = prefix + templateId;

						if(!(templateElement = $templateCache.get(templateCahceKey))) {
							$templateRequest(templateId, false /* ingoreErrors */).then(function (tmpl) {
								templateElement = tmpl;
								resolve(templateElement);
							},
							function () {
								templateElement = $templateCache.get(prefix + defaultTemplate);
								resolve(templateElement);
							});
						} else {
							resolve(templateElement);
						}
					});
				}


				if($scope.data.form) {
					formBuffer.pending = true;
					jsonLoader($scope.data.form).then(function(data) {
						formBuffer.data = data;
						 formBuild($scope.data.form);
					});
				} else {
					formBuffer.data = null;
					formBuild(null);
				}

				$scope.schema.uri = $scope.data.schema;
				$scope.schema.deref($scope.schema.uri).then(function(schemaData) {
					formBuild();
				});

				loadTemplate($scope.data.template).then(function (templateElement) {
					$compile(angular.element(templateElement))($scope, function (cloned, scope) {
						$element.prepend(cloned);
					});
				});

				// Enable language hot-swapping
				$scope.$watch('data.language', function(uri) {
					var code = i18n.code(uri);

					if(uri && !code) {
						i18n.add(uri).then(function(code) {
							$scope.language.code = code;
							$scope.form.translate(code);
						});
					} else {
						$scope.language.code = code;
						$scope.form.translate(code);
					}
				});

			}]
		};
	}]);

})();
