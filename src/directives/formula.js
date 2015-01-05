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
			controller: ['$scope', '$attrs', '$element', function($scope, $attrs, $element) {
				var controller = this, formBuffer = { pending: false, data: null };
				
				controller.model    = $scope.model = $scope.data.model || {};
                controller.schema   = $scope.schema = new schema();
                controller.form     = $scope.form = new form($scope.data.model);
				
				$scope.template = $scope.data.template || 'default';
				$scope.language = { uri: $scope.data.language || null, code: null };
				
				function formBuild(formURI) {
					if(!formBuffer.pending || formURI) {
						$scope.schema.then(function(schemaData) {
							if(schemaData) {
								formBuffer.pending = false;
								controller.form = $scope.form = new form($scope.model, formURI);
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
				
				// Enable template hot-swapping
				$scope.$watch('data.template', function(template) {
					var templateName = (template || ""), templateElement;
					
					if(templateName.substr(0, -5) != '.html') {
						templateName += '.html';
					}
					
					if(!(templateElement = $templateCache.get(templateName))) {
						templateElement = $templateCache.get('default.html');
					}
					
					if($element.prop('tagName') == 'FORM') {
						$element.empty();
						$element.append(templateElement.children());
						$compile($element.children())($scope);
					} else {
						$element.empty();
						$element.prepend(templateElement);
						$compile($element.children())($scope);
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
					controller.model = $scope.model = model;
					formBuild();
				}, true);
			}]
		};
	}]);
