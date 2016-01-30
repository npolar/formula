/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 *
 */
angular.module('formula')
  .service('formulaClassService', [function() {


    // Add class based on field parents and ID
    var addPathClass = function(node, elem) {
      var path = 'formula-';

      angular.forEach(node.parents, function(parent) {
        path += parent.id + '/';
      });

      if (node.id) {
        path += node.id;
      } else if (node.parents) {
        path = path.substr(0, path.length - 1);
      }

      elem.addClass(path);
    };

    // Add css class of schema type
    var addSchemaClass = function(node, elem) {
      var schemaType = node.mainType;
      if (schemaType) {
        elem.addClass(
          "formula" +
          schemaType.charAt(0).toUpperCase() +
          schemaType.slice(1)
        );
      }
    };


    return {
      addSchemaClass: addSchemaClass,
      addPathClass: addPathClass
    };
  }
]);

})();
