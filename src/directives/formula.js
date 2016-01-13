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
		'formulaCustomTemplateService', '$http', '$compile', '$templateCache', '$templateRequest', '$q', '$rootScope',
	function(jsonLoader, model, Schema, Form, i18n, formulaCustomTemplateService, $http, $compile, $templateCache, $templateRequest, $q, $rootScope) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				if(!$scope.data) {
					throw "No formula options provided!";
				}

				var setLanguage = function (uri) {
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
				};

				var loadTemplate = function (templateId) {
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
				};

				var loadModel = function (data) {
					if (data) {
						formLoaded.then(function () {
							$scope.form.updateValues(data);
							$scope.data.ready = true;
						});
					}
				};

				$scope.schema = new Schema();
				Promise.resolve($scope.data.model).then(function(response) {
					loadModel(response.data || response);
				}, function () {
					$scope.data.ready = true;
				});

				formulaCustomTemplateService.setTemplates($scope.data.templates);

				$scope.template = $scope.data.template || 'default';
				setLanguage($scope.data.language);

				var asyncs = [loadTemplate($scope.data.template), $scope.schema.deref($scope.data.schema)];
				if ($scope.data.form) {
					asyncs.push(jsonLoader($scope.data.form));
				}

				var formLoaded = $q.all(asyncs).then(function(data) {
					$scope.form = $scope.data.formula = new Form(data[1], data[2]);
					$scope.form.onsave = $scope.data.onsave || $scope.form.onsave;
					$scope.form.translate($scope.language.code);
					$compile(angular.element(data[0]))($scope, function (cloned, scope) {
						$element.prepend(cloned);
					});
					return true;
				});

				// Enable language hot-swapping
				$scope.$watch('data.language', function(newUri, oldUri) {
					if (newUri && newUri !== oldUri) {
						setLanguage(newUri);
					}
				});

				// Enable data hot-swapping
				$scope.$watchCollection('data.model', function(newData, oldData) {
					if (newData && newData !== oldData) {
						loadModel(newData);
					}
				});

				// Enable template hot-swapping
				$scope.$watchCollection('data.templates', function(newData, oldData) {
					if (newData && newData !== oldData) {
						formulaCustomTemplateService.setTemplates(newData);
						if ($scope.form) {
							$scope.form.updateCustomTemplates();
						}
					}
				});

				// Don't leave memory leaks
				$scope.$on('$destroy', function () {
					$scope.form.fields().forEach(function (field) {
						if (typeof field.destroyWatcher === 'function') {
							field.destroyWatcher();
						}
					});
					$scope.data.formula = undefined;
					model.data = {};
					$rootScope.$on('revalidate', function () {});
				});

				this.data = $scope.data; // Others need this
			}]
		};
	}]);

})();
