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
	['formulaJsonLoader', 'formulaModel', 'formulaSchema', 'formulaForm', 'formulaI18n',
		'formulaCustomTemplateService', '$http', '$compile', '$templateCache', '$templateRequest', '$q',
	function(jsonLoader, model, Schema, Form, i18n, formulaCustomTemplateService, $http, $compile, $templateCache, $templateRequest, $q) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				if(!$scope.data) {
					throw "No formula options provided!";
				}

				$scope.schema = new Schema();
				if ($scope.data.model) {
					model.data = $scope.data.model;
				}

				formulaCustomTemplateService.setTemplates($scope.data.templates);

				$scope.template = $scope.data.template || 'default';
				$scope.language = { uri: $scope.data.language || null, code: null };

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

				var asyncs = [$scope.schema.deref($scope.data.schema)];
				if ($scope.data.form) {
					asyncs.push(jsonLoader($scope.data.form));
				}

				var formLoaded = $q.all(asyncs).then(function(data) {
					$scope.form = $scope.data.formula = new Form($scope.data.form);
					$scope.form.onsave = $scope.data.onsave;
					$scope.form.build(data[0], data[1]);
					$scope.form.translate($scope.language.code);
					return true;
				});

				loadTemplate($scope.data.template).then(function (templateElement) {
					$compile(angular.element(templateElement))($scope, function (cloned, scope) {
						$element.prepend(cloned);
					});
				});

				// Enable language hot-swapping
				$scope.$watch('data.language', function(newUri, oldUri) {
					if (newUri && newUri !== oldUri) {
						var code = i18n.code(newUri);
						formLoaded.then(function () {
							if(!code) {
								i18n.add(newUri).then(function(code) {
									$scope.language.code = code;
									$scope.form.translate(code);
								});
							} else {
								$scope.language.code = code;
								$scope.form.translate(code);
							}
						});
					}
				});

				// Enable data hot-swapping
				$scope.$watch('data.model', function(newData, oldData) {
					if (newData && newData !== oldData) {
						formLoaded.then(function () {
							if(model.set(newData)) {
								$scope.form.updateValues();
							}
						});
					}
				}, true);

				this.data = $scope.data; // Others need this
			}]
		};
	}]);

})();
