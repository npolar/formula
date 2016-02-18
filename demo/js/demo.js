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
          array_object: [{
            string_default: 'one',
            number: 1
          }, {
            string_default: 'two',
            number: 1
          }, {
            string_default: 'three',
            number: 1
          }, {
            string_default: 'four',
            number: 1
          }],
          array_string_enum: ['foo', 'qux'],
          array_string: ['foobar', 'bazquz'],
          ref_object: {
            name: 'test',
            email: 'foo',
            dn: 'no'
          },
          nested_array: [
            [1, 2],
            [3, 4]
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
        $scope.formula.i18n.add('json/no.json', 'nb_NO', ['nb', 'no']);
        $scope.formula.i18n.set('no');
        console.log('fieldByPath', $scope.formula.getFieldByPath('#/array_object/0/number'));
      };

      var updateModel2 = function() {
        $scope.formula.setModel({
          boolean: false,
        });
        console.log("timeout 2");
        $scope.formula.i18n.add({ fieldsets: ["Striiiiiiings"]}, 'nb_NO');
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
        // languages: [{
        //   code: 'nb_NO',
        //   aliases: ['nb', 'no'],
        //   uri: 'json/no.json'
        // }],
        model: getResource()
      });
      $scope.formula.addTemplate({
        match: "ref_object",
        templateUrl: "customObject.html"
      });
      $timeout(updateModel, 1000);
      //$timeout(updateModel2, 2000);


      $scope.remove = function() {
        $scope.$destroy();
      };
    }
  ]);
