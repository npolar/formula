"use strict";
/* globals angular */

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')

/**
 * @factory model
 *
 * Service used for data preservation.
 *
 * @returns A singleton for preserving data
 */

.service('formulaModel',
  [function() {
    var model = {
      data: {},
      set: function(data) {
        if (data) {
          this.data = data;
          return true;
        }

        return false;
      }
    };

    return model;
  }]);
