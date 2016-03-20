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
