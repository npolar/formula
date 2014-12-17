/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formula',
	['formulaJsonLoader', 'formulaSchema', 'formulaForm', 'formulaI18n', '$http', '$compile', '$templateCache',
	function(jsonLoader, schema, form, i18n, $http, $compile, $templateCache) {
		return {
			restrict: 'A',
            scope: { data: '=formula' },
			controller: ['$scope', '$attrs', function($scope, $attrs) {
				var controller = this, formBuffer = { pending: false, data: null };
				
				controller.model    = $scope.data.model || {};
                controller.schema   = $scope.schema = new schema();
                controller.form     = $scope.form = new form($scope.model);
				
				$scope.template = $scope.data.template || 'default';
				$scope.language = { uri: $scope.data.language || null, code: null };
				
				function formBuild(formURI) {
					if(!formBuffer.pending || formURI) {
						$scope.schema.then(function(schemaData) {
							if(schemaData) {
								formBuffer.pending = false;
								controller.form = $scope.form = new form(controller.model, formURI);
								$scope.form.build(schemaData, formBuffer.data);
								$scope.form.translate($scope.language.code);
							}
						});
					}
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
				$scope.$watch('data.model', function(model) {
					controller.model = model;
				}, true);
			}],
			link: function(scope, element, attrs, controller) {
				var template = angular.element($templateCache.get('default.html'));
				
				// TODO: Template hot-swapping
				if(attrs.formulaTemplate) {
					var templStr = attrs.formulaTemplate, templElem;
					if(templStr.substr(0, -5) != '.html') {
						templStr += '.html';
					}
					if((templElem = $templateCache.get(templStr))) {
						template = templElem;
					}
				}
				
				if(element.prop('tagName') == 'FORM') {
					if(!element.children().length) {
						element.append(template.children());
						$compile(element.children())(scope);
					}
				} else {
					var formElem = element.find('form');
					if(!formElem.length) {
						element.prepend(template);
						$compile(element.children())(scope);
					}
				}
			}
		};
	}]);
