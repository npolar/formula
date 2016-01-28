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

/**
 * @factory model
 *
 * Service used for data preservation.
 *
 * @returns A constructor for model data preservation.
 */

.factory('formulaModel',
  [function() {
    function Model(data) {
      this.data = ("object" === typeof data ? angular.copy(data) : {});
    }

    return Model;
  }]);

})();
