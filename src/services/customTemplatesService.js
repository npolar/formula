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

      var getMatchingTemplate = function(templates, field) {
        if (templates) {
          for (var i in templates) {
            if (templates[i].match && templates[i].match.call({}, field)) {
              return templates[i];
            }
          }
        }
        return null;
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


      var getCustomTemplate = function(template, field) {
        var deferred = $q.defer();
        if (template) {
          if (template.hidden) {
            deferred.resolve(false);
          } else if (template.template) {
            deferred.resolve(template.template);
          } else if (template.template === "") {
            deferred.resolve(false);
          } else if (template.templateUrl) {
            doTemplateRequest(template.templateUrl).then(function (template) {
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
        var template = getMatchingTemplate(templates, field);
        if (!template) {
          return;
        }
        getCustomTemplate(template, field).then(function (template) {
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
