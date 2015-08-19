"use strict";
/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	.directive('formulaField',
	['$compile', 'formulaModel',
	function($compile, model) {
		return {
			restrict: 'A',
			require: [ '^formula', '?^formulaFieldInstance' ],
			scope: { field: '=formulaField' },
			link: function(scope, element, attrs, controller) {
				var field = scope.field;
				scope.form = controller[0].form;
				scope.backupValue = null;

				if(controller[1]) {
					scope.field = controller[1].field;
				}

				attrs.$set('id', field.uid);
				attrs.$set('ngModel', 'field.value');
				attrs.$set('formulaField'); // unset

				if(field.disabled) {
					attrs.$set('disabled', 'disabled');
				}

				var elem = angular.element(element);
				var type = field.type ? field.type.split(':') : null;
				type = type ? { main: type[0], sub: type[1] } : null;

				if(type.main === 'input') {
					switch(type.sub) {
					case 'textarea':
						elem = angular.element('<textarea>');
						break;

					case 'select':
						elem = angular.element('<select>');

						if(element.children().length) {
							angular.forEach(element.children(), function(child) {
								elem.append(child);
							});
						} else {
							elem.attr('ng-options', 'value.id as value.label for value in field.values');
						}

						if(field.multiple) {
							elem.attr('multiple', 'multiple');
						}
						break;

					default:
						elem = angular.element('<input>');
						elem.attr('type', type.sub);

						switch(type.sub) {
						case 'number':
						case 'range':
							if(field.step !== null) {
								elem.attr('step', field.step);
							}
							break;

						case 'any':
							elem.attr('type', 'text');
							break;
						}
					}

					angular.forEach(attrs, function(val, key) {
						if(attrs.$attr[key]) {
							elem.attr(attrs.$attr[key], val);
						}
					});
				}

				// Add class based on field parents and ID
				var path = 'formula-';

				angular.forEach(field.parents, function(parent) {
					path += parent.id + '/';
				});

				if(field.id) {
					path += field.id;
				} else if(field.parents) {
					path = path.substr(0, path.length - 1);
				}

				elem.addClass(path);

				$compile(elem)(scope, function (cloned, scope) {
					element.replaceWith(cloned);
				});

				if(type.main === 'input') {
					scope.$watch('field.value', function(n, o) {
						if(!field.dirty && (n !== o)) {
							field.dirty = true;
						}

						if(!field.parents) {
							field.validate(true, true);
						}
					});
				} else if(type.main === 'object') {
					scope.$watch('field.fields', function() {
						field.validate(false, true);
					}, true);
				} else if(type.main === 'array') {
					scope.$watch('field.values', function() {
						field.validate(false, true);
					}, true);
				}

				// Evaluate condition
				if(field.condition) {
					scope.model = model.data;
					scope.$watchCollection('model', function(model) {
						var pass = true, condition = (field.condition instanceof Array ? field.condition : [ field.condition ]);

						angular.forEach(condition, function(cond) {
							var local = model, parents = field.parents, pathSplitted;

							if(pass) {
								// Absolute JSON path
								if(cond[0] === '#') {
									parents = [];

									// Slash-delimited resolution
									if(cond[1] === '/') {
										pathSplitted = cond.substr(1).split('/');
									}

									// Dot-delimited resolution
									else {
										pathSplitted = cond.substr(1).split('.');
										if(!pathSplitted[0].length) {
											parents.splice(0, 1);
										}
									}

									angular.forEach(pathSplitted, function(split, index) {
										if(isNaN(split)) {
											parents.push({ id: split, index: null });
										} else if(index > 0) {
											parents[index - 1].index = Number(split);
										}
									});

									cond = parents[parents.length - 1].id;
									parents.splice(parents.length - 1, 1);
								}

								angular.forEach(parents, function(parent) {
									if(local) {
										local = (parent.index !== null ? local[parent.index][parent.id] : local[parent.id]);
									}
								});

								if(local && field.index !== null) {
									local = local[field.index];
								}

								var evaluate = scope.$eval(cond, local);
								if(!local || evaluate === undefined || evaluate === false) {
									pass = false;
								}
							}
						});

						if(field.visible !== (field.visible = field.hidden ? false : pass)) {
							var currentValue = field.value;
							field.value = scope.backupValue;
							scope.backupValue = currentValue;
						}
					});
				}
			},
			terminal: true
		};
	}]);
