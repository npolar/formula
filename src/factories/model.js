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
	function() {
        var model = {
            data: {},
            locked: false,
            set: function(data) {
                if(!this.locked) {
                    this.data = data;
					return true;
				}
				
				return false;
            }
        };
        
        return model;
	});
