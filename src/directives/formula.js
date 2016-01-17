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
	['formulaJsonLoader', 'formulaSchema', 'formulaForm', 'formulaI18n',
		'formulaCustomTemplateService', '$http', '$compile', '$templateCache', '$templateRequest', '$q', '$rootScope',
	function(jsonLoader, Schema, Form, i18n, formulaCustomTemplateService, $http, $compile, $templateCache, $templateRequest, $q, $rootScope) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				var ctrl = this;
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

				$scope.schema = new Schema();

				formulaCustomTemplateService.setTemplates($scope.data.templates);

				$scope.template = $scope.data.template || 'default';
				setLanguage($scope.data.language);

				var asyncs = [loadTemplate($scope.data.template),
					$scope.schema.deref($scope.data.schema), Promise.resolve($scope.data.model)];
				if ($scope.data.form) {
					asyncs.push(jsonLoader($scope.data.form));
				}

				var formLoaded = $q.all(asyncs).then(function(responses) {
					$scope.form = ctrl.form = $scope.data.formula = new Form(responses[1], responses[2], responses[3]);
					$scope.form.onsave = $scope.data.onsave || $scope.form.onsave;
					$scope.form.translate($scope.language.code);
					$compile(angular.element(responses[0]))($scope, function (cloned, scope) {
						$element.prepend(cloned);
					});
					$scope.data.ready = true;
					return true;
				});

				// Enable language hot-swapping
				$scope.$watch('data.language', function(newUri, oldUri) {
					if (newUri && newUri !== oldUri) {
						formLoaded.then(function () {
							setLanguage(newUri);
						});
					}
				});

				// Enable data hot-swapping
				$scope.$watchCollection('data.model', function(newData, oldData) {
					if (newData && newData !== oldData) {
						formLoaded.then(function () {
							$scope.form.updateValues(newData);
						});
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
					$rootScope.$on('revalidate', function () {});
				});

				this.data = $scope.data; // Others need this
			}]
		};
	}]);

})();
