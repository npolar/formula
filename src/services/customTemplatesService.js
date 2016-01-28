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
  .service('formulaCustomTemplateService', ['$templateCache', '$templateRequest', '$q',
    function($templateCache, $templateRequest, $q) {

      var templates;

      var getMatchingConfig = function(templates, field) {
        var config;
        templates.forEach(function (tmpl) {
          if (tmpl.match) {
            if ((typeof tmpl.match === 'function') && tmpl.match.call({}, field)) {
              config = tmpl;
            } else if ((typeof tmpl.match === 'string') && (field.path === tmpl.match || field.id === tmpl.match)) {
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


      var getCustomTemplate = function(config, field) {
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
              deferred.reject();
            });
          } else {
            deferred.reject();
          }
        } else {
          deferred.reject();
        }

        return deferred.promise;
      };

      var initField = function (field) {
        if (!templates) {
          return;
        }
        var config = getMatchingConfig(templates, field);
        if (!config) {
          return;
        }
        getCustomTemplate(config, field).then(function (template) {
          if (template) {
            field.customTemplate = template;
          } else {
            field.hidden = true;
          }
        });
      };

      var setTemplates = function (tmpls) {
        templates = tmpls;
      };

      return {
        setTemplates: setTemplates,
        initField: initField
      };
    }
  ]);

})();
