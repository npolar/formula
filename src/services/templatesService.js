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
    function($templateCache, $templateRequest, $q, log) {

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

      var templates = DEFAULT_TEMPLATES;

      var getMatchingConfig = function(templates, node) {
        var config;
        templates.forEach(function (tmpl) {
          if (tmpl.match) {
            if ((typeof tmpl.match === 'function') && tmpl.match.call({}, node)) {
              config = tmpl;
            } else if (typeof tmpl.match === 'string' && tmpl.match === node.mainType) {
              config = tmpl;
            }
          }
        });
        return config;
      };

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
        var config = getMatchingConfig(templates, field);
        var deferred = $q.defer();
        if (config) {
          if (config.hidden) {
            deferred.resolve(false);
          } else if (config.template) {
            deferred.resolve(config.template);
          } else if (config.template === "") {
            deferred.resolve(false);
          } else if (config.templateUrl) {
            doTemplateRequest(config.templateUrl).then(function (template) {
              deferred.resolve(template);
            }, function () {
              deferred.reject(config.templateUrl);
            });
          } else {
            deferred.resolve(false);
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

      var setTemplates = function (tmpls) {
        templates = tmpls;
      };

      return {
        setTemplates: setTemplates,
        initNode: initNode,
      };
    }
  ]);

})();
