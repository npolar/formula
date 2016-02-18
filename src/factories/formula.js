/* globals angular */
angular.module('formula').factory('formula', ['$q', 'formulaI18n', 'formulaTemplateService', 'formulaSchema', 'formulaJsonLoader', 'formulaForm',
  function($q, i18n, templates, Schema, jsonLoader, Form) {
    "use strict";


    var Formula = function(options) {
      if (!options) {
        throw "No formula options provided!";
      }
      var _cfg = {};
      var schema = new Schema();
      var asyncs = [schema.deref(options.schema), jsonLoader(options.model), jsonLoader(options.form)];

      if (options.templates instanceof Array) {
        templates.setTemplates(options.templates);
      }

      (options.languages instanceof Array ? options.languages : []).forEach(function(language, index) {
        i18n.add(language.uri || language.map, language.code, language.aliases).then(function (locale) {
          if (locale.code === i18n.code) {
            setLanguage(locale.code); // If we added more texts to the currect locale, re-set it.
          }
        });
      });

      var formLoaded = $q.all(asyncs).then(function(responses) {
        createForm(responses[1], responses[2]);
        return responses;
      }, function() {
        console.error('Could not load form', arguments);
      });

      var setLanguage = function(code) {
        i18n.set(code).then(function() {
          if (_cfg.controller) {
            _cfg.controller.setLanguage(code);
          }
        });
      };
      setLanguage(options.language || 'en');

      var createForm = function(model, formDefinition) {
        if (_cfg.form) {
          _cfg.form.destroy();
        }
        _cfg.form = new Form(schema.json, model, formDefinition, options.keepFailing);
        if (_cfg.controller) {
          _cfg.controller.setForm(_cfg.form);
          _cfg.form.translate();
        }
        _cfg.form.onsave = options.onsave || _cfg.form.onsave;
      };

      this.setModel = function(model) {
        formLoaded.then(function(responses) {
          createForm(model, responses[2]);
        });
      };

      this.setForm = function(form) {
        var asyncs = [formLoaded];
        if (typeof form === 'string') {
          asyncs.push(jsonLoader(form));
        } else {
          asyncs.push(Promise.resolve(form));
        }
        $q.all(asyncs).then(function(responses) {
          createForm(responses[0][1], responses[1]);
        });
      };

      this.setTemplates = function(templates) {
        templates.setTemplates(templates);
        if (_cfg.controller) {
          _cfg.controller.updateTemplates();
        }
      };

      this.addTemplate = function(template) {
        templates.addTemplate(template);
        if (_cfg.controller) {
          _cfg.controller.updateTemplate(template);
        }
      };

      this.setOnSave = function(onsave) {
        _cfg.form.onsave = onsave;
      };

      this.save = function() {
        return _cfg.form.save();
      };

      this.getSchema = function () {
        var deferred = $q.defer();
        formLoaded.then(function(responses) {
          deferred.resolve(_cfg.form.schema);
        });
        return deferred.promise;
      };

      this.getFieldByPath = function (jsonPath) {
        var deferred = $q.defer();
        formLoaded.then(function(responses) {
          var field = _cfg.form.fields().find(function (field) {
            return field.path === jsonPath;
          });
          deferred.resolve(field);
        });
        return deferred.promise;
      };

      this.getFields = function () {
        var deferred = $q.defer();
        formLoaded.then(function(responses) {
          deferred.resolve(_cfg.form.fields());
        });
        return deferred.promise;
      };

      this.i18n = {
        add: i18n.add,
        set: setLanguage,
        get code() {
          return i18n.code;
        }
      };

      this._cfg = _cfg;
      return this;
    };

    return {
      getInstance: function(options) {
        return new Formula(options);
      }
    };
  }
]);
