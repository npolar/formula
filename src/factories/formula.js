/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula').factory('formula',
	['$q', 'formulaTemplateService', 'formulaSchema', 'formulaJsonLoader', 'formulaForm', function($q, templates, Schema, jsonLoader, Form) {



		return function Formula(options) {
			if(!options) {
				throw "No formula options provided!";
			}

			var _cfg = {};
			var schema = new Schema();
			_cfg.language = options.language;

			if (options.templates instanceof Array) {
				templates.setTemplates(options.templates);
			}

			this.setLanguage = function (uri) {
				_cfg.language = uri;
				if (_cfg.controller) {
					_cfg.controller.setLanguage(uri);
				}
			};

			this.setModel = function (model) {
				formLoaded.then(function (responses) {
					createForm(model, responses[2]);
				});
			};

			this.setForm = function (form) {
				var asyncs = [formLoaded];
				if (typeof form === 'string') {
					asyncs.push(jsonLoader(form));
				} else {
					asyncs.push(Promise.resolve(form));
				}
				$q.all(asyncs).then(function (responses) {
					createForm(responses[0][1], responses[1]);
				});
			};

			this.setTemplates = function (templates) {
				templates.setTemplates(templates);
				if (_cfg.controller) {
					_cfg.controller.updateTemplates();
				}
			};

			this.addTemplate = function (template) {
				templates.addTemplate(template);
				if (_cfg.controller) {
					_cfg.controller.updateTemplates();
				}
			};

			this.setOnSave = function (onsave) {
				_cfg.form.onsave = onsave;
			};

			this.setSchema = function (schema) {
				schema = new Schema();
				formLoaded.then(function (responses) {
					createForm(responses[1], responses[2]);
				});
			};

			var asyncs = [schema.deref(options.schema), Promise.resolve(options.model)];

			if (options.form) {
				if (typeof options.form === 'string') {
					asyncs.push(jsonLoader(options.form));
				} else {
					asyncs.push(Promise.resolve(options.form));
				}
			}

			var createForm = function (model, formDefinition) {
				if (_cfg.form) {
					_cfg.form.destroy();
				}
				_cfg.form = new Form(schema.json, model, formDefinition);
				if (_cfg.controller) {
					_cfg.controller.setForm(_cfg.form);
					_cfg.controller.setLanguage(_cfg.language);
				}
				_cfg.form.onsave = options.onsave || _cfg.form.onsave;
			};

			var formLoaded = $q.all(asyncs).then(function(responses) {
				createForm(responses[1], responses[2]);
				return responses;
			}, function () {
				console.error('Could not load form', arguments);
			});

			this._cfg = _cfg;
    };
	}]);

})();
