/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula')
	
	/**
	 * @factory schema
	 * 
	 * Service used to create JSON Schema wrapper class instances.
	 * 
	 * @returns schema class constructor
	 */
	
	.factory('formulaSchema',
	['$q', 'formulaJsonLoader', 'formulaLog',
	function($q, jsonLoader, log) {
		/**
		 * @class schema
		 * 
		 * JSON Schema wrapper class.
		 */
		
		function schema(uri) {
			this.deferred = null;
			this.json = null;
			this.uri = uri || null;
		}
		
		schema.cache = {};
		
		schema.prototype = {
			/**
			 * @method compile
			 * 
			 * Function used to compile $ref's, effectively replacing the json contents.
			 *
			 * @returns true if all references were successfully solved, otherwise false
			 */
			
			compile: function() {
				var self = this;
				
				function selfDeref(path) {
					if(path[0] == '#') {
						path = path.substr(path[1] == '/' ? 2 : 1).split('/');
						var schemaJson = self.json;
						
						angular.forEach(path, function(subpath) {
							if(schemaJson) {
								schemaJson = (schemaJson[subpath]);
							}
						});
						
						return schemaJson;
					}
					
					return null;
				}
				
				// TODO: Prevent circular refs
				function refCompile(schemaJson, parentJson, parentKey) {
					var missing = [], deref;
					
					angular.forEach(schemaJson, function(data, key) {
						if(typeof data == 'object') {
							missing = missing.concat(refCompile(data, schemaJson, key));
						} else if(key == '$ref' && parentJson) {
							if(data[0] == '#') {
								if((deref = selfDeref(data))) {
									parentJson[parentKey] = deref;
								} else {
									missing.push(data);
									delete parentJson[parentKey];
								}
							} else {
								if(schema.cache[data] && schema.cache[data].json) {
									parentJson[parentKey] = schema.cache[data].json;
								} else {
									missing.push(data);
									delete parentJson[parentKey];
								}
							}
						}
					});
					
					return missing;
				}
				
				var missing = (this.json ? refCompile(this.json) : [ this.uri ]);
				
				if(missing.length) {
					angular.forEach(missing, function(uri) {
						log.warning(log.codes.SCHEMA_MISSING_REFERENCE, { schema: uri });
					});
					
					return false;
				}
				
				return true;
			},
			
			/**
			 * @method deref
			 * 
			 * Function used to retrieve and deref JSON Schema from URI.
			 * 
			 * @param uri URI to JSON Schema as string
			 * @returns $q promise object to loaded JSON Schema
			 */
			
			deref: function(uri) {
				var self = this;
				this.deferred = $q.defer();
				
				if(uri && typeof uri == 'string') {
					if(!schema.cache[uri]) {
						var root = {
							schema: schema.cache[uri] = new schema(uri),
							missing: null,
							resolve: function(uri) {
								if(uri && this.missing instanceof Array) {
									var index = this.missing.indexOf(uri);
									if(index != -1) {
										this.missing.splice(index, 1);
									}
								}
									
								if(!this.missing || !this.missing.length) {
									this.schema.compile();
									self.json = this.schema.json;
									self.deferred.resolve(self.json);
								}
							}
						};
						
						jsonLoader(uri).then(function(data) {
							root.schema.json = data;
							var missing = root.schema.missing(false);
							
							if(missing) {
								root.missing = angular.copy(missing);
								angular.forEach(missing, function(uri) {
									if(!schema.cache[uri]) {
										var ref = new schema();
										ref.deref(uri).then(function() {
											root.resolve(uri);
										});
									} else {
										schema.cache[uri].then(function() {
											root.resolve(uri);
										});
									}
								});
							} else {
								root.resolve();
							}
						}, function(error) {
							self.deferred.reject(error);
						});
					} else {
						schema.cache[uri].then(function(data) {
							self.json = data;
							self.deferred.resolve(data);
						});
					}
				} else {
					log.warning(log.codes.SCHEMA_INVALID_URI, { uri: uri });
					this.deferred.reject('Invalid schema URI: ' + uri);
				}
				
				return this;
			},
			
			/**
			 * @method missing
			 * 
			 * Function used to find all $ref URIs in schema.
			 * Optionally only return non-cached $ref URIs.
			 * 
			 * @param ignoreCached Only return non-chached $ref URIs if true
			 * @returns An array of uncompiled $ref URIs or null if empty
			 */
			
			missing: function(ignoreCached) {
				function refArray(json) {
					var refs = [];
					angular.forEach(json, function(data, key) {
						if(typeof data == 'object') {
							var subRefs = refArray(data);
							angular.forEach(subRefs, function(ref) {
								refs.push(ref);
							});
						} else if(key == '$ref' && data[0] != '#') {
							if(!ignoreCached || !schema.cache[data]) {
								refs.push(data);
							}
						}
					});
					return refs;
				}
				
				var refs = refArray(this.json);
				return refs.length ? refs : null;
			},
			
			/**
			 * @method then
			 * 
			 * Function running a callback-function when schema is successfully compiled.
			 * 
			 * @param callback Callback function with one parameter for JSON data
			 */
			
			then: function(callback) {
				if(this.deferred) {
					this.deferred.promise.then(function(data) {
						callback(data);
					}, function(error) {
						// TODO: Failed schema promise
					});
				} else {
					callback(this.json);
				}
			}
		};
		
		return schema;
	}]);
