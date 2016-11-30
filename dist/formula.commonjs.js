var angular = require("angular");var tv4 = require("tv4");module.exports = /* globals angular */

(function() {
  "use strict";

  /**
   * formula.js
   * Generic JSON Schema form builder
   *
   * Norsk Polarinstutt 2014, http://npolar.no/
   */

  angular.module('formula', []);
})();

/* globals angular */
angular.module('formula').directive('formulaField', ['$compile', 'formulaClassService', 'formulaI18n',
  function($compile, formulaClassService, i18n) {
    "use strict";

    return {
      restrict: 'AE',
      scope: {
        field: '='
      },
      link: function(scope, iElement, iAttrs) {
        var field = scope.field;
        iElement.addClass(formulaClassService.pathClass(field));
        iElement.addClass(formulaClassService.schemaClass(field));
        if (field.required) {
          iElement.addClass('required');
        }
        scope.i18n = i18n;
        scope.$watch('field.template', function (template) {
          if (!field.hidden && field.template) {
            iElement.html(field.template);
            $compile(iElement.contents())(scope);
            field._elem_q.resolve(iElement);
          } else {
            field._elem_q.reject(iElement);
          }
        });
      },
    };
  }
]);

/* globals angular */
angular.module('formula').directive('formulaFields', ['$compile', 'formulaClassService', 'formulaI18n',
  function($compile, formulaClassService, i18n) {
    "use strict";


    return {
      restrict: 'AE',
      scope: {
        fields: '='
      },
      compile: function(tElement, tAttrs) {
        if (tElement.html()) {
          var innerTemplate = tElement.html();
          tElement.empty();
        }
        return function link(scope, iElement, iAttrs) {
          scope.i18n = i18n;
          scope.fields.forEach(function(field) {
            var fieldScope = scope.$new();
            fieldScope.field = field;
            fieldScope.parent = field.parents[field.parents.length - 1];
            var template = innerTemplate || '<formula:field field="field"></formula:field>';
            if (!field.hidden && template) {
              $compile(template)(fieldScope, function(cloned, scope) {
                iElement.append(cloned);
              });
            }
          });
        };
      }
    };
  }
]);

/* globals angular */
angular.module('formula').directive('formulaFieldsets', ['$compile', 'formulaClassService', 'formulaDirtyCheckService',
  function($compile, formulaClassService, formulaDirtyCheckService) {
    "use strict";

    return {
      restrict: 'AE',
      require: '?^^form',
      link: function(scope, iElement, iAttrs, formController) {
        scope.form.fieldsets.forEach(function(fieldset) {
          var template = fieldset.template;
          if (!fieldset.hidden && template) {
            var fieldsetScope = scope.$new();
            var elem = angular.element(template);
            fieldsetScope.fieldset = fieldset;
            elem.addClass(formulaClassService.schemaClass(fieldset));
            $compile(elem)(fieldsetScope, function(cloned, scope) {
              iElement.append(cloned);
            });

            if (formController) {
              formController.$setPristine();
              formulaDirtyCheckService.setForm(formController);
            }
          }
        });
      }
    };
  }
]);

/* globals angular */
angular.module('formula').directive('formula', ['$compile', '$timeout', 'formulaI18n', 'formulaClassService',
  function($compile, $timeout, i18n, formulaClassService) {
    "use strict";


    return {
      restrict: 'AE',
      scope: {
        options: '='
      },
      controller: ['$scope', function($scope) {
        if (!$scope.options) {
          throw "No formula options provided!";
        }

        var controller = {
          setLanguage: function(code) {
            $scope.language = code;
            if (this.form) {
              this.form.translate();
            }
            $timeout();
          },

          setForm: function(form) {
            $scope.form = this.form = form;
          }
        };

        var init = function () {
          controller.setForm($scope.options.form);
          controller.setLanguage(i18n.code);

          $scope.options.controller = controller;
          $scope.i18n = i18n;
        };

        init();
      }],
      link: function(scope, iElement, iAttrs) {
        scope.$watch('form', function(form) {
          if (form) {
            iElement.addClass(formulaClassService.schemaClass(form));
            iElement.html(form.template);
            $compile(iElement.contents())(scope);

            // http://stackoverflow.com/a/19686824/1357822
            var to;
            var listener = scope.$watch(function() {
              clearTimeout(to);
              to = setTimeout(function() {
                listener();
                $timeout(function() {
                  scope.form.ready = true;
                }, 100);
              }, 50);
            });
          }
        });
      }
    };
  }
]);

/* globals angular */
angular.module('formula').directive('formulaInput', ['$compile',
  function($compile) {
    "use strict";


    var getInputElement = function(field, type, element) {
      var elem;
      switch (type.sub) {
        case 'textarea':
          elem = angular.element('<textarea>');
          elem.attr('md-detect-hidden', true); // FIXME move to template in common
          break;

        case 'select':
          elem = angular.element('<select>');

          if (element.children().length) {
            angular.forEach(element.children(), function(child) {
              elem.append(child);
            });
          } else {
            elem.attr('ng-options', 'value.id as value.label for value in field.values');
          }

          if (field.multiple) {
            elem.attr('multiple', 'multiple');
          }
          break;

        default:
          elem = angular.element('<input>');
          elem.attr('type', type.sub);

          switch (type.sub) {
            case 'number':
            case 'range':
              if (field.step !== null) {
                elem.attr('step', field.step);
              }
              break;

            case 'any':
            case 'date':
            case 'datetime':
            case 'time':
              elem.attr('type', 'text');
              break;
          }
      }

      return elem;
    };


    var getType = function(field) {
      var type = field.type ? field.type.split(':') : null;
      type = type ? {
        main: type[0],
        sub: type[1]
      } : null;
      return type;
    };


    var setAttrs = function(attrs) {
      attrs.$set('id', '{{field.uid}}');
      attrs.$set('ngModel', 'field.value');
      attrs.$set('ng-disabled', 'field.disabled');
      attrs.$set('ng-readonly', 'field.readonly');
    };

    var getElement = function(scope, element, attrs) {
      var field = scope.field;
      var type = getType(field);
      var elem = getInputElement(field, type, element);

      angular.forEach(attrs, function(val, key) {
        if (attrs.$attr[key]) {
          elem.attr(attrs.$attr[key], val);
        }
      });
      return elem;
    };

    return {
      restrict: 'AE',
      scope: {
        field: '='
      },
      compile: function(tElement, tAttrs, transclude) {

        return function link(scope, iElement, iAttrs) {
          setAttrs(iAttrs);
          var elem = getElement(scope, iElement, iAttrs);
          elem.removeAttr('formula:input');
          $compile(elem)(scope, function(cloned, scope) {
            iElement.replaceWith(cloned);
          });
        };
      }
    };
  }
]);

/* globals angular */
angular.module('formula').factory('formulaFieldset', ['formulaFieldBuilder', 'formulaTemplateService',
  function(fieldBuiler, templates) {
    "use strict";


    function fieldsetFromSchema(schema, data) {
      if (schema && schema.type === 'object') {
        var fieldsets = [{
          fields: [],
          active: true,
          id: 'the-fieldset',
          mainType: '@fieldset',
          valid: true
        }];

        Object.keys(schema.properties).forEach(function(key) {
          var val = schema.properties[key];
          var newField = fieldBuiler.build({
            schema: val,
            id: key
          });
          if (newField) {
            newField.setRequired(schema.required);
            newField.valueFromModel(data);
            fieldsets[0].fields.push(newField);
          }
        });
        templates.initNode(fieldsets[0]);
        return fieldsets;
      }

      throw "Can't create fieldsets from schema";
    }

    var fieldsetFromDefinition = function(schema, formDefinition, data) {
      if (schema && schema.type === 'object' && formDefinition.fieldsets) {
        var fieldsets = [];

        formDefinition.fieldsets.forEach(function(fs, i) {
          var fieldset = {
            title: fs.title,
            active: (i ? false : true),
            fields: [],
            id: 'fs' + i,
            mainType: '@fieldset',
            valid: true
          };
          fieldsets.push(fieldset);
          fs.fields.forEach(function(f, j) {
            var key = (typeof f === 'string') ? f : f.id;
            var fieldSchema = schema.properties[key] || {
              id: key
            };
            var duplicate = fieldsets.reduce(function (memo, fieldset) {
              return memo.concat(fieldset.fields);
            }, []).find(function (field) {
              return field.id === key;
            });
            var newField = fieldBuiler.build({
              schema: fieldSchema,
              id: key,
              fieldDefinition: f
            });

            if (duplicate) {
              newField.value = duplicate.value;
              if (duplicate.values) {
                newField.values = duplicate.values;
              }
              if (duplicate.fields) {
                newField.fields = duplicate.fields;
              }
            }

            if (newField) {
              newField.setRequired(schema.required);
              newField.valueFromModel(data);
              fieldset.fields.push(newField);
            }
          });
          templates.initNode(fieldset);
        });
        return fieldsets;
      }

      throw "Can't create fieldsets from schema/formDefinition";
    };

    return {
      fieldsetFromSchema: fieldsetFromSchema,
      fieldsetFromDefinition: fieldsetFromDefinition
    };
  }
]);

/* globals angular,window,console */
angular.module('formula').factory('formulaForm', ['$rootScope', '$location', 'formulaJsonLoader', 'formulaModel', 'formulaI18n',
  'formulaEvaluateConditionsService', 'formulaTemplateService', 'formulaFieldset', 'formulaDirtyCheckService',
  function($rootScope, $location, jsonLoader, Model, i18n, formulaEvaluateConditionsService, templates, formulaFieldset, dirtyCheckService) {
    "use strict";

    /**
     * @class form
     *
     * HTML form handler class.
     *
     * @param schema Mandatory JSON Schema object
     * @param data
     * @param formDefinition Optional form definition object
     */
    function Form(schema, data, formDefinition, keepFailing) {
      this.errors = null;

      this.schema = schema;
      this.formDefinition = formDefinition;
      this.title = null;
      this.valid = false;
      this.model = new Model(data);
      this.mainType = '@form';

      templates.initNode(this);
      formulaEvaluateConditionsService.setKeepFailing(!!keepFailing);

      var defaultLang = 'en';
      if (formDefinition) {
        this.title = formDefinition.title;
        this.fieldsets = formulaFieldset.fieldsetFromDefinition(schema, formDefinition, this.model.data);

        defaultLang = formDefinition.lang || defaultLang;
      } else {
        this.fieldsets = formulaFieldset.fieldsetFromSchema(schema, this.model.data);
      }

      this.onsave = function(model) {
        window.open("data:application/json," + JSON.stringify(model));
        this.ready = true;
      };

      var self = this;
      this.destroyWatcher = $rootScope.$on('revalidate', function() {
        self.validate();
      });
      this.destoryDirtyChecker = $rootScope.$on('$locationChangeStart', function(event, next, prev) {
        if (dirtyCheckService.isDirty() && self.confirmDirtyNavigate) {
          event.preventDefault();
          self.confirmDirtyNavigate(function () {
            dirtyCheckService.override();
            var baseTag = document.head.querySelector('base'), base;
            base = baseTag ? baseTag.href.replace(/\/$/, '') : location.protocol + '//' + location.host;
            $location.path(next.replace(base, ''));
          });
        }
      });

      i18n.addDefaultLanguage(this, defaultLang).then(function () {
        self.translate();
      });
      this.activate = this.activate.bind(this);
      this.validate(true, true);
    }

    var collectFields = function(field) {
      var fields = [];

      var recurseField = function(field) {
        fields.push.apply(fields, collectFields(field));
      };

      if (field.typeOf('array')) {
        field.items.forEach(recurseField);
        field.values.forEach(recurseField);
      } else if (field.typeOf('object')) {
        field.fields.forEach(recurseField);
      }
      fields.push(field);

      return fields;
    };

    Form.prototype = {

      updateTemplates: function() {
        templates.initNode(this);
        this.fieldsets.forEach(templates.initNode);
        this.fields().forEach(templates.initNode);
      },

      updateTemplate: function(template) {
        templates.evalTemplate(this, template);
        this.fieldsets.forEach(function(fieldset) {
          templates.evalTemplate(fieldset, template);
        });
        this.fields().forEach(function(field) {
          templates.evalTemplate(field, template);
        });
      },

      fields: function() {
        var fields = [];
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            fields.push.apply(fields, collectFields(field));
          });
        });
        return fields;
      },

      destroy: function() {
        this.fields().forEach(function(field) {
          field.destroy();
        });
        this.destroyWatcher();
        this.destoryDirtyChecker();
      },

      /**
       * @method activate
       *
       * Function used to activate a specified fieldset.
       * Useful to hide inactive fieldsets when using a tabbed environment.
       *
       * @param fieldset An object or an index number representing the fieldset
       */
      activate: function(fieldset) {
        if (!this.fieldsets) {
          return; // might be called before form is ready
        }
        var fs;
        this.fieldsets.forEach(function(f, i) {
          if (typeof fieldset === 'object' || typeof fieldset === 'number') {
            if ((typeof fieldset === 'object') ? (f === fieldset) : (i === fieldset)) {
              f.active = true;
              fs = f;
            } else {
              f.active = false;
            }
          }
        });
        $rootScope.$broadcast('activate:fieldset', fs);
      },

      /**
       * @method toggleArrays
       *
       * Function used to collapse/expand all arrays in the form.
       */
      toggleArrays: function() {
        this.fieldsets.forEach(function(fieldset) {
          fieldset.fields.forEach(function(field) {
            field.values.forEach(function(value, index) {
              field.itemToggle(index);
            });
          });
        });
      },

      /**
       * @method save
       *
       * Function calling a provided callback function used to save the form.
       * This function automatically injects the current form model object as a parameter.
       * If the callback parameter is not set, the model is displayed in a new window.
       *
       * @param validate Prevent form validation if this parameter is set to false
       */
      save: function(validate) {
        if ((validate !== false) && !this.validate(true)) {
          console.warn('Document not vaild', this.errors);
          throw this.errors;
        }

        if (typeof this.onsave === 'function') {
          this.ready = false;
          return this.onsave(this.model.data);
        }
      },

      /**
       * @method translate
       *
       * Function used to translate the form to language set in i18n service.
       *
       */
      translate: function() {
        this.fieldsets.forEach(function(fs, i) {
          if (i18n.fieldsets) {
            fs.title = i18n.fieldsets[i] || fs.title;
          }
          if (i18n.fields) {
            fs.fields.forEach(function(field) {
              if (i18n.fields[field.id]) {
                field.translate(i18n.fields[field.id]);
              }
            });
          }
        });
      },

      /**
       * @method validate
       *
       * Function used to validate all the fields within the form.
       * This function also populates the form errors member if the validation fails.
       *
       * @returns true if the entire form is valid, otherwise false
       */
      validate: function(force, silent) {
        var form = this;
        this.errors = [];
        var fieldValidate = function(field, fieldset) {
          var valid = true;
          if (field.typeOf('array')) {
            field.values.forEach(function(value) {
              fieldValidate(value, fieldset);
            });
          } else if (field.typeOf('object')) {
            field.fields.forEach(function(subfield) {
              fieldValidate(subfield, fieldset);
            });
          }

          // jshint -W041,-W116
          if ((field.dirty || force) && field.instance == null) {
            if (field.validate(force, silent)) {
              delete fieldset.errors[field.id];
            } else {
              if (field.typeOf('input') && !silent) {
                fieldset.errors[field.id] = field.error;
              }
              valid = false;
            }
          }
          return valid;
        };

        this.valid = true;
        this.fieldsets.forEach(function(fieldset) {
          fieldset.valid = true;
          fieldset.errors = fieldset.errors || {};
          fieldset.fields.forEach(function(field) {
            if (fieldValidate(field, fieldset)) {
              form.model.data[field.id] = field.value;
            } else {
              fieldset.valid = silent || (field.valid === false ? false : fieldset.valid);
              form.valid = false;
              delete form.model.data[field.id];
            }
          });
          form.errors = form.errors.concat(Object.keys(fieldset.errors).map(function (key) {
            return key + ': ' + fieldset.errors[key];
          }));
        });

        formulaEvaluateConditionsService.evaluateConditions(this);

        if (this.valid) {
          this.errors = null;
        }
        return this.valid;
      }
    };

    return Form;
  }
]);

/* globals angular */
angular.module('formula').factory('formulaFormat', [function() {
  "use strict";

  return {
    color: // CSS 2.1 color
      function(data, schema) {
      var colors = "aqua,black,blue,fuchsia,gray,green,lime,maroon,navy,olive,orange,purple,red,silver,teal,white,yellow";

      if (typeof data === 'string') {
        // TODO: rgb-colors restricted to values between 0 and 255 (inclusive)
        if (colors.split(',').indexOf(data.toLowerCase()) !== -1 || /^(#([a-f0-9]{3}|[a-f0-9]{6})|rgb\(\s?\d{1,3}%?,\s?\d{1,3}%?,\s?\d{1,3}%?\s?\))$/i.test(data)) {
          return null;
        }

      }

      return 'CSS 2.1 color';
    },
    date: // ISO 8601 date
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}(-\d{2}){2}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 date, e.g. 2015-11-30 (year-month-day)';
    },
    datetime: // ISO 8601 datetime combination
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}(-\d{2}){2}T\d{2}(:\d{2}){2}(.\d+)?(([+-](\d{2}|\d{4}|\d{2}:\d{2}))|Z)$/.test(data)) {
        return null;
      }

      return 'ISO 8601 datetime, e.g. 2015-11-30T23:45:30Z';
    },
    yearmonth: // ISO 8601 date (without day)
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}-\d{2}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 date without day fraction, e.g. 2016-01 (year-month)';
    },
    year: // ISO 8601 four-digit year
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 four-digit year, e.g. 2015';
    },
    email: // RCF 3696 email
      function(data, schema) {
      var local = /^[-+a-z0-9!#$%&'*=?^_`{|}~\/]([-+a-z0-9!#$%&'*=?^_`{|}~\/]|\.(?!\.)){0,62}[-+a-z0-9!#$%&'*=?^_`{|}~\/]$/i,
        domain = /^[-a-z0-9]([-a-z0-9]|\.(?!\.)){0,253}[-a-z0-9]$/i, // TODO: IPv4 and IPv6 support
        comment = /\(.*\)/g,
        parts = (typeof data === 'string' ? data.split('@') : []);

      if (parts.length === 2 && data.length <= 254) {
        if (local.test(parts[0].replace(comment, '')) && domain.test(parts[1].replace(comment, ''))) {
          return null;
        }
      }

      return 'RCF 3696 e-mail address';
    },
    time: // ISO 8601 time
      function(data, schema) {
      if (typeof data === 'string' && /^\d{2}(:\d{2}){2}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 time, e.g. 23:45:30';
    },
    uri: // RFC 3986 URI
      function(data, schema) {
      if (typeof data === 'string' && /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i.test(data)) {
        return null;
      }

      return 'RFC 3986 URI';
    }
  };
}]);

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
      var formDefinition;
      var asyncs = [schema.deref(options.schema), jsonLoader(options.model), jsonLoader(options.form)];
      var setLanguage = function(code) {
        i18n.set(code).then(function() {
          if (_cfg.controller) {
            _cfg.controller.setLanguage(code);
          }
        });
      };


      if (options.templates instanceof Array) {
        templates.setTemplates(options.templates);
      }

      var languagePromises = (options.languages instanceof Array ? options.languages : []).map(function(language, index) {
        return i18n.add(language.uri || language.map, language.code, language.aliases);
      });

      $q.all(languagePromises).then(function (responses) {
        setLanguage(options.language || 'en');
      });

      var formLoaded = $q.all(asyncs).then(function(responses) {
        formDefinition = responses[2];
        createForm(responses[1], responses[2]);
        return responses;
      }, function() {
        console.error('Could not load form', arguments);
      });

      var createForm = function(model, form) {
        if (_cfg.form) {
          _cfg.form.destroy();
        }
        _cfg.form = new Form(schema.json, model, form, options.keepFailing);
        if (_cfg.controller) {
          _cfg.controller.setForm(_cfg.form);
          _cfg.form.translate();
        }
        _cfg.form.onsave = options.onsave || _cfg.form.onsave;
        _cfg.form.confirmDirtyNavigate = options.confirmDirtyNavigate;
      };

      this.setModel = function(model) {
        options.model = model;
        formLoaded.then(function(responses) {
          createForm(model, formDefinition);
        });
      };

      this.getModel = function() {
        return _cfg.form ? _cfg.form.model.data : options.model;
      };

      this.setForm = function(form) {
        var asyncs = [formLoaded];
        if (typeof form === 'string') {
          asyncs.push(jsonLoader(form));
        } else {
          asyncs.push(Promise.resolve(form));
        }
        $q.all(asyncs).then(function(responses) {
          formDefinition = responses[1];
          createForm(options.model, responses[1]);
        });
      };

      this.setTemplates = function(templates) {
        templates.setTemplates(templates);
        formLoaded.then(function(responses) {
          _cfg.form.updateTemplates();
        });
      };

      this.addTemplate = function(template) {
        templates.addTemplate(template);
        formLoaded.then(function(responses) {
          _cfg.form.updateTemplate(template);
        });
      };

      this.setOnSave = function(onsave) {
        options.onsave = onsave;
        if (_cfg.form) {
          _cfg.form.onsave = onsave;
        }
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

      this.setConfirmDirtyNavigate = function (confirm) {
        options.confirmDirtyNavigate = confirm;
        if (_cfg.form) {
          _cfg.form.confirmDirtyNavigate = confirm;
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

/* globals angular, tv4 */
angular.module('formula').factory('formulaI18n', ['formulaJsonLoader', 'formulaLog', '$q',
  function(jsonLoader, log, $q) {
    "use strict";

    var DEFAULT_TEXTS = {
      code: 'en',
      text: {
        actions: {
          label: 'More',
          tooltip: 'Click for more actions'
        },
        add: {
          label: 'Add',
          tooltip: 'Click to add a new item'
        },
        invalid: '{count} invalid fields',
        moveup: {
          label: 'Move up',
          tooltip: 'Click to move item up'
        },
        movedown: {
          label: 'Move down',
          tooltip: 'Click to move item down'
        },
        maximize: {
          label: 'Maximize',
          tooltip: 'Click to maximize item'
        },
        minimize: {
          label: 'Minimize',
          tooltip: 'Click to minimize item'
        },
        remove: {
          label: 'Remove',
          tooltip: 'Click to remove item'
        },
        required: 'required',
        save: {
          label: 'Save',
          tooltip: 'Click to save document'
        },
        validate: {
          label: 'Validate',
          tooltip: 'Click to validate form'
        },
        item: 'Item {item}: {error}',
      },
      fields: {},
      fieldsets: []
    };

    var currentLocale = DEFAULT_TEXTS;
    var cache = {};
    var languagePromises = {};
    var codeAliases = {};

    var set = function(code) {
      var cacheKey = codeAliases[code];
      tv4.language(cacheKey.replace('_', '-'));
      if (languagePromises[cacheKey]) {
        return Promise.resolve(languagePromises[cacheKey]).then(function(locale) {
          currentLocale = locale;
          currentLocale.code = cacheKey;
        });
      }

    };

    var addTv4 = function(lang, key) {
      if (lang.tv4) {
        tv4.addLanguage(key.replace('_', '-'), lang.tv4);
      }
    };

    /**
     * @method add
     *
     * Function used to add a new translation from JSON URI.
     *
     * @param lang URI to JSON containing translation or translation object
     * @param code for this translation
     * @param code aliases. eg. no => nb => nb_NO
     * @returns $q promise object resolving to ISO 639-3 code
     */

    var add = function(lang, code, aliases) {
      if (!lang) {
        log.warning(log.codes.I18N_MISSING_URI);
        return;
      }
      if (!code) {
        log.warning(log.codes.I18N_MISSING_CODE, {
          uri: lang
        });
        return;
      }

      var deferred = $q.defer();
      (aliases instanceof Array ? aliases : [aliases])
      .forEach(function(alias) {
        codeAliases[alias] = code;
      });
      codeAliases[code] = code;
      var cacheKey = codeAliases[code];
      languagePromises[cacheKey] = deferred.promise;

      if (typeof lang === 'string') { // lang is uri
        jsonLoader(lang).then(function(data) {
          var translations = cache[cacheKey] || {};
          cache[cacheKey] = angular.merge(translations, data);
          addTv4(cache[cacheKey], cacheKey);
          deferred.resolve(cache[cacheKey]);
        });
      } else { // lang is map
        var translations = cache[cacheKey] || {};
        cache[cacheKey] = angular.merge(translations, lang);
        addTv4(cache[cacheKey], cacheKey);
        deferred.resolve(cache[cacheKey]);
      }

      return deferred.promise;
    };

    var gatherFields = function (memo, fields) {
      fields.forEach(function (field) {
        memo[field.id] = {
          title: field.title || field.id,
          description: field.description
        };
        if (field.typeOf("object") && field.fields) {
          memo[field.id].fields = {};
          gatherFields(memo[field.id].fields, field.fields);
        } else if (field.typeOf("field") && field.items[0]) {
          memo[field.id].items = {};
          gatherFields(memo[field.id].items, field.items);
        } else if (field.typeOf("fieldset") && field.items[0]) {
          memo[field.id].items = {
            title: field.items[0].title,
            description: field.items[0].description,
          };
          if (field.items[0].items) { // nested arrays
            memo[field.id].items.items = {};
            gatherFields(memo[field.id].items.items, field.items[0].items);
          } else {
            memo[field.id].items.fields = {};
            gatherFields(memo[field.id].items.fields, field.items[0].fields);
          }
        } else if (field.typeOf("select") && field.values) {
          memo[field.id].values = field.values.map(function (value) {
            return value.label;
          });
        }
      });
      return memo;
    };

    var addDefaultLanguage = function (form, code) {
      var lang = angular.merge({}, {
        fieldsets: form.fieldsets.map(function (fs) {
          return fs.title;
        }),
        fields: form.fieldsets.reduce(function (memo, fs) {
          return gatherFields(memo, fs.fields);
        }, {}),
        code: code
      }, cache[code]);
      return add(lang, code).then(function () {
        if (currentLocale.code === code) {
          set(code);
        }
      });
    };

    add(DEFAULT_TEXTS, 'en');

    return {
      add: add,
      set: set,
      get fields() {
        return currentLocale.fields;
      },
      get fieldsets() {
        return currentLocale.fieldsets;
      },
      get text() {
        return currentLocale.text;
      },
      get code() {
        return currentLocale.code;
      },
      addDefaultLanguage: addDefaultLanguage
    };
  }
]);

/* globals angular */
angular.module('formula').factory('formulaJsonLoader', ['$http', '$q', 'formulaLog',
  function($http, $q, log) {
    "use strict";

    var jsonLoader;

    return (jsonLoader = function(uri, jsonp, rerun) {
      var deferred = $q.defer();
      if (typeof uri !== "string") { // uri is not uri but schema object
        deferred.resolve(uri);
      } else {
        (jsonp ? $http.jsonp(uri + '?callback=JSON_CALLBACK') : $http.get(uri))
        .success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).error(function(data, status, headers, config) {
          if (!jsonp) {
            return jsonLoader(uri, true);
          }

          log.error(log.codes.JSON_LOAD_ERROR, {
            uri: uri
          });
          deferred.reject(uri);
        });
      }

      return deferred.promise;
    });
  }
]);

/* globals angular,console */
angular.module('formula').factory('formulaLog', [
  function() {
    "use strict";

    var codes = {
      FIELD_INVALID_ID: 'field ID contains an illegal character: {character} ({field})',
      FIELD_MISSING_PROPERTY: 'missing required field property: {property} ({field})',
      FIELD_UNSUPPORTED_FORMAT: 'unsupported string format: {format} ({field})',
      FIELD_UNSUPPORTED_PROPERTY: 'unsupported field property: {property} ({field})',
      FIELD_UNSUPPORTED_TOKEN: 'unsupported default token: {token} ({field})',
      FIELD_UNSUPPORTED_TYPE: 'unsupported field type: {type} ({field})',
      FIELD_HIDDEN_DEFAULT: 'field hidden by default: {field}',
      I18N_MISSING_CODE: 'missing language code: {uri}',
      I18N_MISSING_URI: 'missing i18n uri',
      JSON_LOAD_ERROR: 'could not load JSON document: {uri}',
      SCHEMA_INVALID_URI: 'invalid URI for schema deref: {uri}',
      SCHEMA_MISSING_PROPERTY: 'missing required schema property: {property} ({schema})',
      SCHEMA_MISSING_REFERENCE: 'missing schema reference: {schema}',
      MISSING_TEMPLATE: 'missing template for {missing}'
    };

    function codeTranslate(code, params) {
      var msg = code,
        match = msg.match(/\{[^\}]*\}/g);
      angular.forEach(match, function(v, k) {
        msg = msg.replace(v, params[v.substr(1, v.length - 2)]);
      });
      return msg;
    }

    return {
      codes: codes,
      debug: function(msg, params) {
        if (params) {
          console.debug(codeTranslate(msg, params));
        } else {
          console.debug(msg);
        }
      },
      error: function(code, params) {
        console.error(codeTranslate(code, params));
      },
      warning: function(code, params) {
        console.warn(codeTranslate(code, params));
      }
    };
  }
]);

/* globals angular */
angular.module('formula').factory('formulaModel', [function() {
  "use strict";

  function Model(data) {
    this.data = ("object" === typeof data ? angular.copy(data) : {});
  }

  return Model;
}]);

/* globals angular */
angular.module('formula').factory('formulaSchema', ['$q', 'formulaJsonLoader', 'formulaLog',
  function($q, jsonLoader, log) {
    "use strict";

    /**
     * @class schema
     *
     * JSON Schema wrapper class.
     */

    function Schema(uri) {
      this.deferred = null;
      this.json = null;
      this.uri = uri || null;
    }

    Schema.cache = {};

    Schema.prototype = {
      /**
       * @method compile
       *
       * Function used to compile $ref's, effectively replacing the json contents.
       *
       * @returns true if all references were successfully solved, otherwise false
       */

      compile: function() {
        var self = this;

        function selfDeref(path) {
          if (path[0] === '#') {
            path = path.substr(path[1] === '/' ? 2 : 1).split('/');
            var schemaJson = self.json;

            angular.forEach(path, function(subpath) {
              if (schemaJson) {
                schemaJson = (schemaJson[subpath]);
              }
            });

            return schemaJson;
          }

          return null;
        }

        // TODO: Prevent circular refs
        function refCompile(schemaJson, parentJson, parentKey) {
          var missing = [],
            deref;

          angular.forEach(schemaJson, function(data, key) {
            if (typeof data === 'object') {
              missing = missing.concat(refCompile(data, schemaJson, key));
            } else if (key === '$ref' && parentJson) {
              if (data[0] === '#') {
                if ((deref = selfDeref(data))) {
                  parentJson[parentKey] = deref;
                } else {
                  missing.push(data);
                  delete parentJson[parentKey];
                }
              } else {
                if (Schema.cache[data] && Schema.cache[data].json) {
                  parentJson[parentKey] = Schema.cache[data].json;
                } else {
                  missing.push(data);
                  delete parentJson[parentKey];
                }
              }
            }
          });

          return missing;
        }

        var missing = (this.json ? refCompile(this.json) : [this.uri]);

        if (missing.length) {
          angular.forEach(missing, function(uri) {
            log.warning(log.codes.SCHEMA_MISSING_REFERENCE, {
              schema: uri
            });
          });

          return false;
        }

        return true;
      },

      /**
       * @method deref
       *
       * Function used to retrieve and deref JSON Schema from URI.
       *
       * @param uri URI to JSON Schema as string
       * @returns $q promise object to loaded JSON Schema
       */

      deref: function(uri) {
        var self = this;
        this.deferred = $q.defer();

        if (uri && typeof uri === 'string') {
          if (!Schema.cache[uri]) {
            var root = {
              schema: Schema.cache[uri] = new Schema(uri),
              missing: null,
              resolve: function(uri) {
                if (uri && this.missing instanceof Array) {
                  var index = this.missing.indexOf(uri);
                  if (index !== -1) {
                    this.missing.splice(index, 1);
                  }
                }

                if (!this.missing || !this.missing.length) {
                  this.schema.compile();
                  self.json = this.schema.json;
                  self.deferred.resolve(self.json);
                }
              }
            };

            jsonLoader(uri).then(function(data) {
              root.schema.json = data;
              var missing = root.schema.missing(false);

              if (missing) {
                root.missing = angular.copy(missing);
                angular.forEach(missing, function(uri) {
                  if (!Schema.cache[uri]) {
                    var ref = new Schema();
                    ref.deref(uri).then(function() {
                      root.resolve(uri);
                    });
                  } else {
                    Schema.cache[uri].then(function() {
                      root.resolve(uri);
                    });
                  }
                });
              } else {
                root.resolve();
              }
            }, function(error) {
              self.deferred.reject(error);
            });
          } else {
            Schema.cache[uri].then(function(data) {
              self.json = data;
              self.deferred.resolve(data);
            });
          }
        } else {
          log.warning(log.codes.SCHEMA_INVALID_URI, {
            uri: uri
          });
          this.deferred.reject('Invalid schema URI: ' + uri);
        }

        return this;
      },

      /**
       * @method missing
       *
       * Function used to find all $ref URIs in schema.
       * Optionally only return non-cached $ref URIs.
       *
       * @param ignoreCached Only return non-chached $ref URIs if true
       * @returns An array of uncompiled $ref URIs or null if empty
       */

      missing: function(ignoreCached) {
        function refArray(json) {
          var refs = [];
          angular.forEach(json, function(data, key) {
            if (typeof data === 'object') {
              var subRefs = refArray(data);
              angular.forEach(subRefs, function(ref) {
                refs.push(ref);
              });
            } else if (key === '$ref' && data[0] !== '#') {
              if (!ignoreCached || !Schema.cache[data]) {
                refs.push(data);
              }
            }
          });
          return refs;
        }

        var refs = refArray(this.json);
        return refs.length ? refs : null;
      },

      /**
       * @method then
       *
       * Function running a callback-function when schema is successfully compiled.
       *
       * @param callback Callback function with one parameter for JSON data
       */

      then: function(callback) {
        if (this.deferred) {
          this.deferred.promise.then(function(data) {
            callback(data);
          }, function(error) {
            // TODO: Failed schema promise
          });
        } else {
          callback(this.json);
        }
      }
    };

    return Schema;
  }
]);

/* globals angular */
angular.module('formula').filter('formulaInlineValues', [function() {
  "use strict";

  return function(values, params) {

    var result = [];

    angular.forEach(values, function(value) {
      if (value instanceof Array) {
        result.push('Array[' + value.length + ']');
      } else switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
          result.push(value);
          break;

        default:
      }
    });

    return result.join(', ');
  };
}]);

/* globals angular */
angular.module('formula').filter('formulaReplace', [function() {
  "use strict";

  return function(input, params) {
    var result = input;

    (input.match(/\{[^\}]*\}/g) || [])
    .forEach(function(val) {
      result = result.replace(val, params[val.substr(1, val.length - 2)]);
    });

    return result;
  };
}]);

/* globals angular */
angular.module('formula').service('formulaClassService', [function() {
  "use strict";

  // class based on field parents and ID
  var pathClass = function(node) {
    var path = node.path;
    path = path.replace('#', 'formula');
    return path;
  };

  // css class of schema type
  var schemaClass = function(node) {
    var schemaType = node.mainType.replace('@', '');
    return "formula" +
      schemaType.charAt(0).toUpperCase() +
      schemaType.slice(1);
  };

  return {
    schemaClass: schemaClass,
    pathClass: pathClass
  };
}]);

/* globals angular */
angular.module('formula').service('formulaDirtyCheckService', [function() {
  "use strict";

  var formCtrl;

  return {
    setForm: function (form) {
      formCtrl = form;
    },
    isDirty: function () {
      return formCtrl ? formCtrl.$dirty : false;
    },
    override: function () {
      if (formCtrl) {
        formCtrl.$setPristine();
        formCtrl.$setUntouched();
      }
    }
  };
}]);

/* globals angular */
angular.module('formula').service('formulaEvaluateConditionsService', ['$rootScope',
  function($rootScope) {
    "use strict";

    var keepFailing = true;

    var evaluateConditions = function(form) {
      var model = {};
      form.fieldsets.forEach(function(fieldset) {
        fieldset.fields.forEach(function(field) {
          model[field.id] = field.value;
        });
      });
      form.fields().forEach(function(field) {
        evaluateField(field, model);
      });
    };

    var evaluateField = function(field, model) {
      // Evaluate condition
      if (field.condition) {
        var pass = true,
          condition = (field.condition instanceof Array ? field.condition : [field.condition]);

        // jshint -W116
        condition.forEach(function(cond) {
          if (pass) {
            // Relative path
            if (cond[0] !== '#') {
              cond = field.path.substr(0, field.path.lastIndexOf('/') + 1) + cond;
            }
            // Absolute JSON path
            cond = cond.substr(2);
            cond = cond.replace(/\/(\d+)/g, '[$1]');
            cond = cond.replace(/\//g, '.');
            // Disable setters
            cond = cond.replace('=', '==').replace('===', '==');

            pass = $rootScope.$eval(cond, model);
          }
        });

        field.visible = field.hidden ? false : pass;

        if (!keepFailing) {
          if (pass) {
            field.value = field.backupValue || field.value;
          } else {
            field.backupValue = field.value;
            field.value = undefined;
          }
        }
      }
    };

    return {
      evaluateConditions: evaluateConditions,
      setKeepFailing: function(val) {
        keepFailing = val;
      }
    };
  }
]);

/* globals angular */
angular.module('formula').service('formulaTemplateService', ['$templateCache', '$templateRequest', '$q', 'formulaLog',
  'formulaFieldConfig',
  function($templateCache, $templateRequest, $q, log, fieldConfig) {
    "use strict";

    // LIFO prio
    var DEFAULT_TEMPLATES = [{
      match: '@field',
      templateUrl: 'formula/default/field.html'
    }, {
      match: '@object',
      templateUrl: 'formula/default/object.html'
    }, {
      match: '@array',
      templateUrl: 'formula/default/array.html'
    }, {
      match: '@fieldset',
      templateUrl: 'formula/default/fieldset.html'
    }, {
      match: '@form',
      templateUrl: 'formula/default/form.html'
    }];

    var configs = fieldConfig.getInstance(DEFAULT_TEMPLATES);

    var doTemplateRequest = function(templateUrl) {
      var templateElement = $templateCache.get(templateUrl);
      if (!templateElement) {
        return $templateRequest(templateUrl, false);
      }
      var deferred = $q.defer();
      deferred.resolve(templateElement);
      return deferred.promise;
    };

    var getTemplate = function(field, templateConfig) {
      var config = templateConfig || configs.getMatchingConfig(field);
      var deferred = $q.defer();
      if (config) {
        if (config.hidden || config.template === "") {
          deferred.resolve(false);
        } else if (config.template) {
          deferred.resolve(config.template);
        } else if (config.templateUrl) {
          doTemplateRequest(config.templateUrl).then(function(template) {
            deferred.resolve(template);
          }, function() {
            deferred.reject(config.templateUrl);
          });
        } else {
          deferred.reject(field.path);
        }
      } else {
        deferred.reject(field.mainType);
      }
      return deferred.promise;
    };

    var initNode = function(node) {
      if (node.template) {
        return;
      }
      getTemplate(node).then(function(template) {
        if (template) {
          node.template = template;
        } else {
          node.hidden = true;
        }
      }, function(missing) {
        log.warning(log.codes.MISSING_TEMPLATE, {
          missing: missing
        });
        node.hidden = true;
      });
    };

    var setTemplates = function(templates) {
      configs.setConfigs(templates);
    };

    var addTemplate = function(template) {
      configs.addConfig(template);
    };

    var evalTemplate = function(node, config) {
      if (configs.isMatch(node, config)) {
        getTemplate(node, config).then(function (template) {
          node.template = template;
        });
      }
    };

    return {
      addTemplate: addTemplate,
      setTemplates: setTemplates,
      initNode: initNode,
      evalTemplate: evalTemplate
    };
  }
]);

angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/default/array.html","<fieldset ng-class=\"{ valid: field.valid, error: field.errors }\"><legend>{{ field.title }} ({{ field.nrArrayValues() || 0 }})</legend><ul ng-if=\"::field.typeOf(\'fieldset\')\"><li ng-repeat=\"value in field.values\" ng-if=\"!value.hidden\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.value | formulaInlineValues }}</span> <a ng-show=\"!$first\" class=\"toggle\" href=\"\" ng-click=\"field.moveUp($index)\" ng-attr-title=\"{{ i18n.text.moveup }}\">&uarr;</a> <a ng-show=\"!$last\" class=\"toggle\" href=\"\" ng-click=\"field.moveDown($index)\" ng-attr-title=\"{{ i18n.text.movedown }}\">&darr;</a> <a class=\"toggle\" href=\"\" ng-click=\"field.itemToggle($index)\" ng-attr-title=\"{{ value.visible ? i18n.text.minimize.tooltip : i18n.text.maximize.tooltip }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" ng-attr-title=\"{{ i18n.text.remove.tooltip }}\">&times;</a></legend><formula:field field=\"value\" ng-if=\"value.visible\"></formula:field></fieldset></li></ul><ul ng-if=\"::field.typeOf(\'field\')\"><li ng-class=\"{ valid: value.valid, error: value.error }\" ng-repeat=\"value in field.values\"><input formula:input=\"\" field=\"value\"><div class=\"input-ctrls\"><a ng-show=\"!$first\" class=\"toggle\" href=\"\" ng-click=\"field.moveUp($index)\" ng-attr-title=\"{{ i18n.text.moveup }}\">&uarr;</a> <a ng-show=\"!$last\" class=\"toggle\" href=\"\" ng-click=\"field.moveDown($index)\" ng-attr-title=\"{{ i18n.text.movedown }}\">&darr;</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" ng-attr-title=\"{{ i18n.text.remove.tooltip }}\">&times;</a></div><div><span ng-if=\"value.error\">{{ value.getErrorText() }}</span> <span ng-if=\"value.description\">{{ value.description }}</span></div></li></ul><div ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ i18n.text.invalid | formulaReplace : { count: field.errors.length } }}</div><div ng-if=\"!field.errors\">{{ field.description }}</div><div class=\"formulaArrayCtrls\"><button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ i18n.text.add.tooltip }}\" type=\"button\"><strong>&plus;</strong> {{ i18n.text.add.label }}</button></div></fieldset>");
$templateCache.put("formula/default/field.html","<div ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value == null) }\" ng-if=\"field.visible\" title=\"{{ field.description }}\"><label for=\"{{ ::field.uid }}\">{{ field.title }} {{field.visibility}}</label><formula:input field=\"field\"></formula:input><span ng-if=\"field.error\">{{ field.getErrorText() }}</span> <span ng-if=\"field.description\">{{ field.description }}</span></div>");
$templateCache.put("formula/default/fieldset.html","<fieldset ng-show=\"fieldset.active\"><formula:fields fields=\"::fieldset.fields\"></formula:fields></fieldset>");
$templateCache.put("formula/default/form.html","<div><div class=\"formula\" ng-if=\"!form.ready\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div><form class=\"formula\" ng-show=\"form.ready\"><header ng-if=\"::form.title\">{{ form.title }}</header><nav ng-if=\"::form.fieldsets.length > 1\"><a href=\"\" ng-class=\"{ active: fieldset.active, error: !fieldset.valid }\" ng-click=\"form.activate(fieldset)\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\">{{ fieldset.title }}</a></nav><formula:fieldsets></formula:fieldsets><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ i18n.text.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-click=\"form.validate(true);\" ng-if=\"!data.hideButtons\" title=\"{{ i18n.text.validate.tooltip }}\"><strong>&#10003;</strong> {{ i18n.text.validate.label }}</button> <button ng-click=\"form.save()\" ng-disabled=\"!form.valid\" ng-if=\"!data.hideButtons\" title=\"{{ i18n.text.save.tooltip }}\"><strong>&#9921;</strong> {{ i18n.text.save.label }}</button></footer></form></div>");
$templateCache.put("formula/default/object.html","<fieldset><legend ng-if=\"::field.title\">{{ field.title }}</legend><formula:fields fields=\"::field.fields\"></formula:fields></fieldset>");}]);
/* globals angular */
angular.module('formula').factory('formulaArrayField', ['$rootScope', 'formulaField', 'formulaI18n', 'formulaArrayFieldTypeService', 'formulaTemplateService',
  function($rootScope, formulaField, i18n, formulaArrayFieldTypeService, formulaTemplateService) {
    "use strict";

    var applyDefaultValue = function(field) {
      if (field.default !== undefined) {
        // Ensure array typed default if required
        if (!(field.default instanceof Array)) {
          field.default = [field.default];
        }
        field.value = field.default;
      } else {
        field.value = [];
      }
    };

    var ArrayField = {
      create: function(options) {
        var field = formulaField.create(options);
        angular.extend(field, ArrayField.prototype);
        formulaArrayFieldTypeService.applyType(field);
        if (!field.type) {
          return;
        }
        field.values = [];
        applyDefaultValue(field);

        field.setItemProto();

        // Add one element to arrays which requires at least one element
        if (field.schema.minItems) {
          field.itemAdd();
        }

        formulaTemplateService.initNode(field);
        field.visible = field.hidden ? false : true;

        return field;
      },
    };

    var countHidden = function(memo, value) {
      return memo + (value.hidden ? 0 : 1);
    };

    ArrayField.prototype = {

      /**
       * @method setItemProto
       *
       * Sets array item prototype
       *
       * @returns true if the field was successfully added, otherwise false
       */
      setItemProto: function() {
        var newField;
        var parents = this.parents.slice();
        parents.push(this);

        if (!this.items) {
          this.items = [];
        }

        var id = /\/([^\/]*?)$/.exec(this.path)[1] + '_item';
        var fieldDefinition = this.fieldDefinition.items || {};
        fieldDefinition.id = id;
        var schema = this.schema.items;
        newField = formulaField.builder.build({
          schema: schema,
          id: id,
          parents: parents,
          fieldDefinition: fieldDefinition
        });
        if (newField) {
          newField.setRequired(this.schema.required);
          newField.index = this.items.length;
          this.items.push(newField);
          return true;
        }
        return false;
      },

      /**
       * @method itemAdd
       *
       * Function used to add a copy of the subfields for validating.
       * The values of each fieldset are automatically monitored.
       *
       * @param preventValidation bool
       * @returns Reference to the item just added
       */
      itemAdd: function(preventValidation) {
        if (this.items) {
          var parents = this.parents.slice();
          parents.push(this);

          var index = this.values.length;
          var proto = this.items[0];
          var field = formulaField.builder.build({
            schema: proto.schema,
            id: proto.id,
            parents: parents,
            fieldDefinition: proto.fieldDefinition,
            index: index
          });
          if (!field.type) {
            return null;
          }
          this.values.push(field);

          if (field.value !== undefined) {
            this.value.push(field.value);
          }
          this.dirty = true;
          this.updateParent();
          if (preventValidation !== true) {
            $rootScope.$emit('revalidate');
          }
          if (this.fieldTranslations) {
            field.translate(this.fieldTranslations);
          }
          return field;
        }

        return null;
      },

      /**
       * @method itemRemove
       *
       * Function used to remove a fieldset from an array-typed field.
       *
       * @param item Index number of the fieldset which should be removed
       * @return removed item
       */
      itemRemove: function(item) {
        var removed;
        if (this.values.length > item) {
          removed = this.values.splice(item, 1)[0];
          this.value.splice(item, 1);
        }

        this.values.forEach(function(fs, i) {
          fs.index = i;
        });

        if (typeof item.destroyWatcher === 'function') {
          item.destroyWatcher();
        }

        this.dirty = true;
        this.updateParent();
        $rootScope.$emit('revalidate');
        return removed;
      },

      moveUp: function (index) {
        var a = this.values[index];
        var b = this.values[index - 1];
        a.index = index - 1;
        b.index = index;
        this.values[index - 1] = a;
        this.values[index] = b;
        this.itemChange();
      },

      moveDown: function (index) {
        var a = this.values[index];
        var b = this.values[index + 1];
        a.index = index + 1;
        b.index = index;
        this.values[index + 1] = a;
        this.values[index] = b;
        this.itemChange();
      },

      itemChange: function(item) {
        this.value.length = 0;

        this.values.forEach(function(field) {
          if (field.value !== undefined) {
            this.value.push(field.value);
          }
        }, this);

        this.dirty = true;
        this.updateParent();
      },

      /**
       * @method itemToggle
       *
       * Function used to toggle visibility of a fieldset item.
       *
       * @param item Index number of the fieldset which should be toggled
       */
      itemToggle: function(item) {
        if (this.values.length > item) {
          this.values[item].visible = !this.values[item].visible;
        }
      },

      destroy: function() {
        this.values.forEach(function (val) {
          val.destroy();
        });
      },

      valueFromModel: function(model, validate) {
        var data = angular.copy(model);
        if (data[this.id] !== undefined) {
          this.values.forEach(function (val) {
            val.destroy();
          });
          this.values.length = 0;
          data[this.id].forEach(function(item, index) {
            var newField = this.itemAdd(true /* preventValidation */ );
            if (newField) {
              if (this.typeOf('fieldset') && newField.index !== 0) {
                newField.visible = false;
              }

              var valueModel = {};
              valueModel[this.values[index].id] = item;
              this.values[index].valueFromModel(valueModel);
            }
          }, this);
          formulaField.prototype.valueFromModel.call(this, data, validate);
        }

      },

      translate: function (translations) {
        if (translations) {
          this.fieldTranslations = translations.items;
          Object.keys(translations.items || {}).forEach(function (key, index) {
            this.items.concat(this.values).forEach(function(field) {
              field.translate(translations.items);
            }, this);
          }, this);
          formulaField.prototype.translate.call(this, translations);
        }
      },

      nrArrayValues: function() {
        if (this.values) {
          return this.values.reduce(countHidden, 0);
        }
        return 0;
      }
    };

    return ArrayField;
  }
]);

/* globals angular */
angular.module('formula').factory('formulaField', ['$q', '$filter', '$rootScope', 'formulaLog', 'formulaI18n', 'formulaTemplateService', 'formulaFieldValidateService',
  function($q, $filter, $rootScope, log, i18n, formulaTemplateService, formulaFieldValidateService) {
    "use strict";

    var fieldBuilder;
    var nextUid = 1;

    var validateFieldId = function(field) {
      ['.', '/', '#'].forEach(function(invalidChar) {
        if (this.id && this.id.indexOf(invalidChar) >= 0) {
          log.warning(log.codes.FIELD_INVALID_ID, {
            character: invalidChar,
            field: this.path
          });
        }
      }, field);
    };

    var assign = function(field, data) {
      if (typeof field === 'object') {
        var attribs = 'condition,default,description,disabled,enum,format,hidden,instance,maximum,maxLength,minimum,minLength,multiple,nullable,pattern,readonly,required,step,title,type,values'.split(',');
        angular.forEach(data, function(v, k) {
          if (attribs.indexOf(k) !== -1) {
            this[k] = v;
          }
        }, field);
      }
    };

    var reduceFieldTypes = function(field) {
      if (field.type instanceof Array) {
        field.nullable = field.type.some(function(type) {
          return type === 'null';
        });
        if (field.type.length === 1) {
          field.type = field.type[0];
        } else if (field.type.length === 2) {
          if (field.type[0] === 'null') {
            field.type = field.type[1];
          } else if (field.type[1] === 'null') {
            field.type = field.type[0];
          }
        } else {
          field.types = field.type;
          field.type = 'any';
          // @TODO support any
        }
      }
    };

    var uidGen = function (field) {
      var uid = 'formula-' + ('00000' + (nextUid++).toString(16)).slice(-5);
      return (field.uid = uid);
    };

    var Field = {
      create: function(options) {
        var field = Object.create(Field.prototype);
        field.parents = options.parents || [];
        field.id = options.id;
        field.title = options.id.replace(/_/g, ' ');
        field.index = options.index;

        field._elem_q = $q.defer();

        assign(field, (field.schema = options.schema));
        assign(field, (field.fieldDefinition = options.fieldDefinition || {}));

        validateFieldId(field);
        uidGen(field);
        reduceFieldTypes(field);

        return field;
      },
      fieldBuilder: fieldBuilder
    };

    Field.prototype = {
      get element() {
        return this._elem_q.promise;
      },

      get path() {
        var path = '#';

        // jshint -W116
        var genFieldPath = function(field) {
          var path = '/';

          // jshint -W041
          if (field.index != null) {
            path += field.index;
          } else {
            path += field.id;
          }
          return path;
        };

        this.parents.forEach(function(parent) {
          path += genFieldPath(parent);
        });

        path += genFieldPath(this);
        return path;
      },

      /**
       * @method typeOf
       *
       * Function used to check if field in a specific type.
       *
       * @param type Type to check
       * @returns true if field type matches with specified type, otherwise false
       */
      typeOf: function(type) {
        if (!(this.type && typeof this.type === 'string')) {
          return false;
        }
        var types;
        return (type === this.type || type === (types = this.type.split(':'))[0] || type === types[1]);
      },

      isEmpty: function() {
        // jshint -W041,-W116
        return (this.value == null || this.value.length === 0);
      },
      /**
       * @method validate
       *
       * Function used to validate the field based on its schema.
       * This function also sets the field error memeber value if the validation fails,
       * and additionally sets the form valid state if a parent form is specified.
       *
       * @returns true if the field is valid, otherwise false
       */
      validate: function(force, silent) {
        return formulaFieldValidateService.validate(this, {
          force: force,
          silent: silent
        });
      },

      valueFromModel: function(model, validate) {
        if (model[this.id] !== undefined && this.value !== model[this.id]) {
          this.value = model[this.id];
          this.dirty = true;

          this.updateParent();

          formulaTemplateService.initNode(this);
          if (validate) {
            $rootScope.$emit('revalidate');
          }
        }
      },

      setRequired: function(required) {
        this.required = (required === true) || (required instanceof Array && required.indexOf(this.id) !== -1);
      },

      translate: function(translations) {
        this.title = translations.title || this.title;
        this.description = translations.description || this.description;
      },

      getErrorText: function(error) {
        var text = '';
        error = error || this.error;
        if (!error) {
          return text;
        }
        if (error.dataPath) {
          var item = Number(error.dataPath.replace(/^\/(\d+).*$/, '$1')) + 1;
          text += $filter('formulaReplace')(i18n.text.item, {
            item: item,
            error: error.message
          });
        } else {
          text += error.message;
        }
        return text;
      },

      destroy: function() {
        if (typeof this.destroyWatcher === 'function') {
          this.destroyWatcher();
        }
      },

      updateParent: function () {
        var parent;
        if ((parent = this.parents[this.parents.length - 1])) {
          parent.itemChange(this);
        }
      }
    };

    return Field;
  }
]);

/* globals angular */
angular.module('formula').factory('formulaFieldConfig', [function() {
  "use strict";

  var Config = function(cfgs) {
    var configs = cfgs || [];

    var isMatch = function(node, cfg) {
      var match = false;
      if (cfg.match) {
        if (typeof cfg.match === 'function') {
          try {
            if (cfg.match.call({}, node)) {
              match = true;
            }
          } catch (e) {
            // noop
          }
        } else if (typeof cfg.match === 'string' && [node.mainType, node.id, node.path].indexOf(cfg.match) !== -1) {
          match = true;
        }
      }
      return match;
    };

    this.getMatchingConfig = function(node) {
      var config;
      var last = configs.length - 1;
      for (var i = last; i >= 0; i--) {
        if (isMatch(node, configs[i])) {
          config = configs[i];
          break;
        }
      }
      return config;
    };

    this.addConfig = function(config) {
      configs.push(config);
    };

    this.setConfigs = function(cfgs) {
      configs = cfgs;
    };

    this.isMatch = function(node, cfg) {
      return isMatch(node, cfg);
    };
  };

  return {
    getInstance: function(configs) {
      return new Config(configs);
    }
  };
}]);

/* globals angular */
angular.module('formula').factory('formulaInputField', ['$rootScope', 'formulaLog', 'formulaField', 'formulaFieldTranslateDefaultsService',
  'formulaInputFieldTypeService', 'formulaTemplateService',
  function($rootScope, log, formulaField, formulaFieldTranslateDefaultsService,
    formulaInputFieldTypeService, formulaTemplateService) {
    "use strict";

    var applyDefaultValue = function(field) {
      if (field.default !== undefined) {
        field.value = field.default;
      } else if (field.typeOf('select') && !field.multiple) {
        field.value = field.enum[0];
      }
    };

    var watchField = function(field) {
      field.destroyWatcher = $rootScope.$watch(function fieldWatch() {
        return field.value;
      }, function(n, o) {
        if (!angular.equals(n, o)) {
          if (field.value === null || field.value === "") {
            field.value = undefined;
            return; // triggers new watch
          }
          field.dirty = true;
          field.updateParent();
          $rootScope.$emit('revalidate');
        }
      });
    };

    var InputField = {
      create: function(options) {
        var field = formulaField.create(options);
        angular.extend(field, InputField.prototype);
        formulaInputFieldTypeService.applyType(field);
        if (!field.type) {
          return;
        }
        formulaFieldTranslateDefaultsService.translateDefaultValues(field);
        applyDefaultValue(field);

        // Set schema pattern if not set and pattern is defined
        if (field.pattern && !field.schema.pattern) {
          field.schema.pattern = field.pattern;
        }

        // Automatically hide fields by default if ID starts with underscore
        if ((field.id && field.id[0] === '_') && field.hidden !== false) {
          log.debug(log.codes.FIELD_HIDDEN_DEFAULT, {
            field: field.path
          });
          field.hidden = true;
        }

        formulaTemplateService.initNode(field);

        field.visible = field.hidden ? false : true;

        watchField(field);
        return field;
      }
    };


    InputField.prototype = {
      translate: function (translations) {
        if (this.typeOf('select') && translations.values) {
          this.values.forEach(function (value, index) {
            value.label = translations.values[index] || value.label;
          }, this);
        }

        formulaField.prototype.translate.call(this, translations);
      }
    };

    return InputField;
  }
]);

/* globals angular */
angular.module('formula').factory('formulaObjectField', ['formulaLog', 'formulaField', 'formulaTemplateService',
  function(log, formulaField, formulaTemplateService) {
    "use strict";

    var applyDefaultValue = function(field) {
      if (field.default !== undefined) {
        field.value = field.default;
      } else {
        field.value = {};
      }
    };

    var applyType = function(field) {
      field.mainType = '@object';
      if (!field.schema.properties) {
        log.warning(log.codes.FIELD_MISSING_PROPERTY, {
          property: 'properties',
          field: field.path
        });
        field.type = null;
      }
    };

    var ObjectField = {
      create: function(options) {
        var field = formulaField.create(options);
        angular.extend(field, ObjectField.prototype);
        applyType(field);
        if (!field.type) {
          return;
        }
        applyDefaultValue(field);

        field.fieldAdd();

        formulaTemplateService.initNode(field);

        field.visible = field.hidden ? false : true;

        return field;
      }
    };

    var skipField = function(fieldDefinition) {
      return (typeof fieldDefinition === 'string' && fieldDefinition.charAt(0) === "!");
    };

    ObjectField.prototype = {

      /**
       * @method fieldAdd
       *
       * Function used to add subfields to object and array-typed field.
       *
       * @param schema JSON Schema defining the field being added
       * @returns true if the field was successfully added, otherwise false
       */

      fieldAdd: function() {
        var parents = this.parents.slice();
        parents.push(this);

        if (!this.fields) {
          this.fields = [];
        }

        Object.keys(this.schema.properties).forEach(function(key) {
          var schema = this.schema.properties[key];
          var fieldDefinition;
          if (this.fieldDefinition.fields) {
            this.fieldDefinition.fields.forEach(function(field) {
              var id;
              if (typeof field === 'string') {
                id = field.replace('!', '');
              } else {
                id = field.id;
              }
              if (key === id) {
                fieldDefinition = field;
              }
            });
          }
          if (!skipField(fieldDefinition)) {
            var newField = formulaField.builder.build({
              schema: schema,
              id: key,
              parents: parents,
              fieldDefinition: fieldDefinition
            });
            if (newField) {
              newField.setRequired(this.schema.required);
              this.fields.push(newField);
            }
          }

        }, this);
      },

      itemChange: function(item) {
        if (this.fields) {
          this.fields.forEach(function(field) {
            if (field.value !== undefined) {
              this.value[field.id] = field.value;
            }
          }, this);
        }
        this.dirty = true;

        this.updateParent();
      },

      valueFromModel: function(model, validate) {
        if (model[this.id] !== undefined) {
          this.fields.forEach(function(fc, index) {
            if (model[this.id][fc.id] !== undefined) {
              fc.valueFromModel(model[this.id]);
            }
          }, this);

          formulaField.prototype.valueFromModel.call(this, model, validate);
        }
      },

      translate: function (translations) {
        if (translations) {
          if (translations.fields) {
            this.fields.forEach(function(field) {
              if (translations.fields[field.id]) {
                field.translate(translations.fields[field.id]);
              }
            });
          }

          formulaField.prototype.translate.call(this, translations);
        }
      },

    };

    return ObjectField;
  }
]);

/* globals angular */
angular.module('formula').service('formulaArrayFieldTypeService', ['$filter', 'formulaLog', 'formulaFormat',
  function($filter, log, format) {
    "use strict";

    var applyType = function(field) {
      field.mainType = '@array';
      field.values = [];
      if (field.schema.items) {
        var items = field.schema.items;

        if (items.type === 'object' || items.type === 'array') {
          field.type = 'array:fieldset';
        } else if (items.allOf) {
          // @TODO
          log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
            property: 'allOf',
            field: field.path
          });
        } else if (items.anyOf) {
          // @TODO
          log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
            property: 'anyOf',
            field: field.path
          });
        } else if (items.oneOf) {
          // @TODO
          log.warning(log.codes.FIELD_UNSUPPORTED_PROPERTY, {
            property: 'oneOf',
            field: field.path
          });
        } else {
          field.type = 'array:field';
        }
        if (field.schema.minItems >= 1) {
          field.required = true;
        }
      } else {
        log.warning(log.codes.FIELD_MISSING_PROPERTY, {
          property: 'items',
          field: field.path
        });
        field.type = null;
      }
    };


    return {
      applyType: applyType
    };
  }
]);

/* globals angular */
angular.module('formula').service('formulaFieldBuilder', ['formulaField', 'formulaInputField', 'formulaObjectField', 'formulaArrayField',
  function(Field, InputField, ObjectField, ArrayField) {
    "use strict";

    var isType = function (schemaType, type) {
      if (schemaType instanceof Array) {
        return schemaType.indexOf(type) !== -1;
      } else {
        return schemaType === type;
      }
    };

    var isEnum = function (schema) {
      return (schema.items && schema.items.enum);
    };

    return {
      build: function(options) {
        var schema = options.schema;
        Field.builder = this;
        if (typeof schema === 'object') {
          var field;
          if (isType(schema.type, 'object')) {
            field = ObjectField.create(options);
          } else if (isType(schema.type, 'array') && !isEnum(schema)) {
            field = ArrayField.create(options);
          } else {
            field = InputField.create(options);
          }
          return field;
        }
      }
    };
  }
]);

/* globals angular */
angular.module('formula').service('formulaFieldTranslateDefaultsService', ['$filter', 'formulaLog',
  function($filter, log) {
    "use strict";

    var translateDefaultValues = function(field) {
      if (typeof field.default === 'string') {
        var match = field.default.match(/^%(.*)%$/),
          replace;
        if (match) {
          switch (match[1]) {
            case 'date':
              replace = $filter('date')(new Date(), 'yyyy-MM-dd', 'UTC');
              break;

            case 'datetime':
              replace = $filter('date')(new Date(), 'yyyy-MM-ddThh:mm:ss', 'UTC') + 'Z';
              break;

            case 'time':
              replace = $filter('date')(new Date(), 'hh:mm:ss', 'UTC');
              break;

            case 'year':
              replace = $filter('date')(new Date(), 'yyyy', 'UTC');
              break;

            default:
              log.warning(log.codes.FIELD_UNSUPPORTED_TOKEN, {
                token: match[1],
                field: field.path
              });
          }

          if (replace) {
            field.default = replace;
          }
        }
      }
    };
    return {
      translateDefaultValues: translateDefaultValues
    };
  }
]);

/* globals angular,tv4 */
angular.module('formula').service('formulaFieldValidateService', [
  function() {
    "use strict";

    var validate = function(field, options) {
      var silent = options.silent,
        force = options.force;
      if (field.schema) {
        var result;

        if ((field.dirty || force) && (field.required || field.value !== undefined)) {
          result = tv4.validateMultiple(field.value, field.schema);
          field.valid = result.valid;
        }

        if (!field.valid && field.nullable) {
          switch (typeof field.value) {
            case 'string':
              if (!field.value || !field.value.length) {
                field.value = null;
              }
              break;

            case 'number':
              if (isNaN(field.value)) {
                field.value = null;
              }
              break;

            case 'object':
              if (field.typeOf('object') && !Object.keys(field.value).length) {
                field.value = null;
              }
              break;
          }

          // Nullable array case..
          if (field.typeOf('array') && field.values && !field.values.length) {
            field.value = null;
          }

          // TODO: Add support for null-types in tv4
          if (field.isEmpty()) {
            field.valid = true;
          }
        }

        if (!silent && result && field.valid === false) {
          if (field.typeOf('array') || field.typeOf('object')) {
            field.errors = result.errors;
          } else {
            field.error = result.errors[0];
          }
        } else {
          field.error = null;
          field.errors = null;
        }
        field.dirty = false;

        return field.valid !== false;
      }
      return false;
    };

    return {
      validate: validate
    };
  }
]);

/* globals angular,tv4 */
angular.module('formula').service('formulaInputFieldTypeService', ['$filter', 'formulaLog', 'formulaFormat',
  function($filter, log, format) {
    "use strict";

    var handleMultiEnum = function (field) {
      field.enum = field.schema.items.enum;
      field.multiple = true;
      if (field.schema.minItems >= 1) {
        field.required = true;
      }
    };

    var handleEnums = function (field) {
      field.values = [];
      field.enum.forEach(function(val) {
        field.values.push({
          id: val,
          label: val
        });
      });
    };

    var applyType = function(field) {
      field.mainType = '@field';
      var newType = 'input:text'; // default
      if (field.schema.items && field.schema.items.enum) { // enums as array in schema
        handleMultiEnum(field);
      }

      if (field.type === 'select' || field.enum) {
        newType = 'input:select';
        handleEnums(field);
      } else if (field.format) {
        var formatNoDash = field.format.replace('-', '');

        if (format[formatNoDash]) {
          tv4.addFormat(field.format, format[formatNoDash]);
          if (['date', 'datetime', 'time'].indexOf(formatNoDash) !== -1) {
            newType = 'input:' + formatNoDash;
          }
        } else {
          log.warning(log.codes.FIELD_UNSUPPORTED_FORMAT, {
            format: field.format,
            field: field.path
          });
        }
      } else {
        switch (field.type) {
          case 'any':
            newType = 'input:any';
            break;

          case 'boolean':
            newType = 'input:checkbox';
            field.value = !!field.value;
            break;

          case 'integer':
          case 'number':
            newType = 'input:number';
            break;

          case 'range':
            newType = 'input:range';
            break;

          case 'textarea':
            newType = 'input:textarea';
            break;

          case 'string':
          case 'text':
            newType = 'input:text';
            break;
          case undefined:
            newType = 'input:text';
            break;

          default:
            log.warning(log.codes.FIELD_UNSUPPORTED_TYPE, {
              type: field.type,
              field: field.path
            });
            newType = null;
        }
      }
      field.type = newType;
    };


    return {
      applyType: applyType
    };
  }
]);
;