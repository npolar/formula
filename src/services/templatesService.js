/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */
angular.module('formula')
  .service('formulaTemplateService', ['$templateCache', '$templateRequest', '$q', 'formulaLog',
    'formulaFieldConfig',
    function($templateCache, $templateRequest, $q, log, fieldConfig) {

      var DEFAULT_TEMPLATES = [
        {
          match: 'field',
          templateUrl: 'formula/default/field.html'
        },
        {
          match: 'object',
          templateUrl: 'formula/default/object.html'
        },
        {
          match: 'array',
          templateUrl: 'formula/default/array.html'
        },
        {
          match: 'fieldset',
          templateUrl: 'formula/default/fieldset.html'
        },
        {
          match: 'form',
          templateUrl: 'formula/default/form.html'
        }
      ];

      var configs = fieldConfig.getInstance(DEFAULT_TEMPLATES);

      var doTemplateRequest = function (templateUrl) {
        var templateElement = $templateCache.get(templateUrl);
        if (!templateElement) {
          return $templateRequest(templateUrl, false);
        }
        var deferred = $q.defer();
        deferred.resolve(templateElement);
        return deferred.promise;
      };

      var getTemplate = function(field) {
        var config = configs.getMatchingConfig(field);
        var deferred = $q.defer();
        if (config) {
          if (config.hidden || config.template === "") {
            deferred.resolve(false);
          } else if (config.template) {
            deferred.resolve(config.template);
          } else if (config.templateUrl) {
            doTemplateRequest(config.templateUrl).then(function (template) {
              deferred.resolve(template);
            }, function () {
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

      var initNode = function (node) {
        getTemplate(node).then(function (template) {
          if (template) {
            node.template = template;
          }
        }, function (missing) {
          log.warning(log.codes.MISSING_TEMPLATE, {
            missing: missing
          });
        });
      };

      var setTemplates = function (templates) {
        configs.setConfigs(templates);
      };

      var addTemplate = function (template) {
        configs.addConfig(template);
      };

      var evalTemplate = function (node, template) {
        configs.isMatch(node, template);
      };

      return {
        addTemplate: addTemplate,
        setTemplates: setTemplates,
        initNode: initNode,
        evalTemplate: evalTemplate
      };
    }
  ]);

})();
