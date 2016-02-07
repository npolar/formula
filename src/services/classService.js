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
    var schemaType = node.mainType;
    return "formula" +
      schemaType.charAt(0).toUpperCase() +
      schemaType.slice(1);
  };


  return {
    schemaClass: schemaClass,
    pathClass: pathClass
  };
}]);
