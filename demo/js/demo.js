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
            number: 2
          }, {
            string_default: 'three',
            number: 3
          }, {
            string_default: 'four',
            number: 4
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
        // $scope.formula.i18n.set('no');
        // $scope.formula.getFieldByPath('#/array_object/0/number').then(function (f) {
        //   console.log('fieldByPath', f);
        // });
      };

      var updateModel2 = function() {
        console.log("timeout 2");
        $scope.formula.i18n.add({ fieldsets: ["Striiiiiiings"]}, 'nb_NO');
        $scope.formula.addTemplate({match: '#/array_string', template: '<h2 style="font-size: 18px;">updated template</h2>'});
        $scope.formula.addTemplate({match: '#/array_object/0', template: '<h2 style="font-size: 18px;">updated template</h2>'});
      };

      var getResource = function() {
        var deferred = $q.defer();
        deferred.resolve({
          string: 'initfoobar',
          boolean: true,
          _rev: 1
        });
        return deferred.promise;
      };

      $scope.formula = formula.getInstance({
        schema: "json/demo-schema.json",
        form: "json/demo-form.json",
        languages: [{
          code: 'en',
          map: {
            fields: {
              "string": {
                "title": "Holabalola"
              },
              "array_object": {
                "fields": {
                  "fields": {
                    "number": {
                      "title": "loooo"
                    }
                  }
                }
              },
            }
          }
        }],
        model: getResource()
      });
      $scope.formula.addTemplate({
        match: "ref_object",
        templateUrl: "customObject.html"
      });
//      $scope.formula.getFields().then(function () {
//        $scope.formula.addTemplate({match: '#/string_required', template: '<h2 style="font-size: 18px;">updated template</h2>'});
//      });
      $scope.formula.i18n.add('json/no.json', 'nb_NO', ['nb', 'no']);

      $scope.remove = function() {
        $scope.$destroy();
      };

      $scope.norwegian = function() {
        $scope.formula.i18n.set('no');
      };

      $scope.english = function() {
        $scope.formula.i18n.set('en');
      };

      $scope.updateModel = function() {
        updateModel();
      };

      $scope.updateModel2 = function() {
        updateModel2();
      };

      $scope.testInstance = function () {
        $scope.formula.setForm("json/instance-demo-form.json");
        $scope.formula.addTemplate({
          match: function (field) {
            return false; //field.id === 'array_string' && field.instance === '2';
          },
          template: '<h2 style="font-size: 18px;">updated template</h2>'});
      };
    }
  ]);
