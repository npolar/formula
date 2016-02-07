/* globals angular */
angular.module('formula').factory('formulaModel', [function() {
  "use strict";

  function Model(data) {
    this.data = ("object" === typeof data ? angular.copy(data) : {});
  }

  return Model;
}]);
