"use strict";
/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formula',
	['formulaJsonLoader', 'formulaModel', 'formulaSchema', 'formulaForm', 'formulaI18n', '$http', '$compile', '$templateCache', '$templateRequest', '$q',
	function(jsonLoader, model, schema, form, i18n, $http, $compile, $templateCache, $templateRequest, $q) {
		return {
			restrict: 'A',
      scope: { data: '=formula' },
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				var controller = this, formBuffer = { pending: false, data: null };

				if($scope.data.model) {
					model.data = $scope.data.model;
					model.locked = true;
				}

				controller.schema	= $scope.schema = new schema();
				controller.form  	= $scope.form = new form();

				$scope.onsave		= $scope.form.onsave;
				$scope.template 	= $scope.data.template || 'default';
				$scope.language 	= { uri: $scope.data.language || null, code: null };

				function formBuild(formURI) {
					if(!formBuffer.pending || formURI) {
						$scope.schema.then(function(schemaData) {
							if(schemaData) {
								formBuffer.pending = false;
								controller.form = $scope.form = new form(formURI);
								$scope.form.onsave = $scope.onsave;
								$scope.form.build(schemaData, formBuffer.data);
								$scope.form.translate($scope.language.code);

								$scope.form.uiSaveHidden		= $scope.data.saveHidden;
								$scope.form.uiValidateHidden	= $scope.data.validateHidden;
							}
						});
					}
				}

				function loadTemplate (template) {
					return $q(function(resolve, reject) {
						var templateName = 'formula/' + (template || 'default'), templateElement;

						if (templateName.substr(0, -5) !== '.html') {
							templateName += '.html';
						}

						if(!(templateElement = $templateCache.get(templateName))) {
							$templateRequest(template, false /* ingoreErrors */).then(function (tmpl) {
								templateElement = tmpl;
								resolve(templateElement);
							},
							function () {
								templateElement = $templateCache.get('formula/default.html');
								resolve(templateElement);
							});
						} else {
							resolve(templateElement);
						}
					});
				}

				// Enable form definition hot-swapping
        $scope.$watch('data.form', function(uri) {
            if(uri) {
                formBuffer.pending = true;
                jsonLoader(uri).then(function(data) {
                    formBuffer.data = data;
                    formBuild(uri);
                });
            } else {
                formBuffer.data = null;
                formBuild(null);
            }
        });

				// Enable schema hot-swapping
				$scope.$watch('data.schema', function(uri) {
					if(($scope.schema.uri = uri)) {
						$scope.schema.deref(uri).then(function(schemaData) {
							formBuild();
						});
					}
				});

				// Enable template hot-swapping
				$scope.$watch('data.template', function(template, oldVal) {
					loadTemplate(template).then(function (templateElement) {
						$element.empty();
						$compile(angular.element(templateElement))($scope, function (cloned, scope) {
							$element.prepend(cloned);
						});
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

				// Enable data hot-swapping
				$scope.$watch('data.model', function(data) {
					if(!formBuffer.pending && model.set(data)) {
						formBuild();
					}

					model.locked = false;
				}, true);

				// Enable onsave callback hot-swapping
				$scope.$watch('data.onsave', function(callback) {
					if(callback) {
						$scope.form.onsave = $scope.onsave = callback;
					}
				});
			}]
		};
	}]);
