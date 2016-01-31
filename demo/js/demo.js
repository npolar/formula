"use strict";
/* globals angular */

angular.module('demo', ['formula'])
  .controller('demoController', ['$scope', '$timeout', '$q', 'formula',
    function($scope, $timeout, $q, formula) {
      var updateModel = function() {
        $scope.formula.setModel({
          _id: 'foobarID',
          string: 'timeoutfoobar',
          boolean: true,
          array_object: Array(2).fill({
            string_default: 'foo',
            number: 1,
            number2: 2,
            number3: 3,
            number4: 4
          }),
          array_string_enum: ['foo', 'qux'],
          array_string: ['foobar', 'bazquz'],
          ref_object: {
            name: 'test',
            email: 'foo',
            dn: 'no'
          },
          nested_array: [
            [1, 2],
            [1, 2]
          ],
          array_hierarchy: [{
            sub_array_one: [{
              sub_sub_array_one: [{
                obj_1_1_1: 'foo',
                obj_1_1_2: 4
              }]
            }]
          }]
        });
        console.log("timeout 1");

        $scope.formula.setLanguage("json/no.json");
      };

      var updateModel2 = function() {
        $scope.formula.setModel({
          boolean: false,
        });
        console.log("timeout 2");
      };

      var getResource = function() {
        var deferred = $q.defer();
        deferred.resolve({
          string: 'initfoobar',
          boolean: true
        });
        return deferred.promise;
      };


      $scope.formula = formula.getInstance({
        schema: "json/demo-schema.json",
        form: "json/demo-form.json",
        language: null,
        model: getResource()
      });
      $scope.formula.addTemplate({
        match: "ref_object",
        templateUrl: "customObject.html"
      });
      $timeout(updateModel, 1000);
      //$timeout(updateModel2, 2000);


      $scope.remove = function () {
        $scope.$destroy();
      };
    }
  ]);
