"use strict";
/* globals angular */

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
            if (templates[i].match && templates[i].match.call({}, angular.copy(field))) {
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


      var getCustomTemplate = function(templates, field) {
        var deferred = $q.defer();
        var template = getMatchingTemplate(templates, field);
        if (template) {
          if (template.hidden) {
            deferred.resolve(false);
            // intentional != (allow empty string)
            // jshint -W116
          } else if (template.template != null) {
            if (template.template === "") {
              deferred.resolve(false);
            } else {
              deferred.resolve(template.template);
            }
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
        getCustomTemplate(templates, field).then(function (template) {
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
