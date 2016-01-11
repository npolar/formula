"use strict";
/* globals angular */

angular.module('demo', ['formula'])
  .controller('demoController', ['$scope', '$timeout', '$q', 'formulaAutoCompleteService',
    function($scope, $timeout, $q, formulaAutoCompleteService) {
      var updateModel = function() {
        $scope.formulaData.model = {
          _id: 'foobarID',
          string: 'timeoutfoobar',
          boolean: true,
          array_object: [{
            string_default: 'foo',
            number: 1
          }, {
            string_default: 'bar',
            number: 2
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
        };
        console.log("timeout");

        $scope.formulaData.language = "json/no.json";
      };

      var getResource = function() {
        var deferred = $q.defer();
        deferred.resolve({
          string: 'initfoobar',
          boolean: true
        });
        return deferred.promise;
      };


      $scope.formulaData = {
        schema: "json/demo-schema.json",
        form: "json/demo-form.json",
        template: null,
        language: null,
        model: getResource(),
        templates: [{
          match(field) {
              return field.id === "ref_object";
            },
            templateUrl: 'customObject.html',
            //template: '<p>{{field.title}}</p>'
        }]
      };


      var fn = function(q) {
        return ["Dalene", "Allan", "Lecia", "Leta", "Matthew", "Marlen", "Collette", "Alfredo", "Francina", "Dorene", "Ali", "Anette", "Courtney", "Arlena", "Spring", "Suzanna", "Roseanne", "Evita", "Gaynell", "Ellena", "Lucinda", "Delisa", "Lamont",
          "Eloy", "Luanna", "Cyndi", "Lynn", "Clare", "Stacey", "Tameka", "Cheryll", "Jong", "Hoyt", "Marhta", "Roselia", "Gala", "Chun", "Weston", "Zola", "Luana", "Arnette", "Delorse", "Libbie", "Nenita", "Lorina", "Carolyn", "Burma", "Russell",
          "Beatris", "Macie"
        ];
      };

      var emailCallback = function(response) {
        var emails = [];
        response.forEach(function(entry) {
          entry.people.forEach(function(person) {
            emails.push(person.email);
          });
        });
        return emails;
      };

      formulaAutoCompleteService.bindSourceCallback("#/autocomplete_fn", fn);
      formulaAutoCompleteService.bindSourceCallback("#/autocomplete_url", emailCallback);

      $timeout(updateModel, 1);

    }
  ]);
