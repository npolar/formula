/* globals angular */

(function() {
"use strict";

/**
 * formula.js
 * Generic JSON Schema form builder
 *
 * Norsk Polarinstutt 2014, http://npolar.no/
 */

angular.module('formula').factory('formulaFieldConfig',
	[function() {

		var Config = function (cfgs) {
			var configs = cfgs || [];

			this.getMatchingConfig = function(node) {
				var config;
				configs.forEach(function (cfg) {
					if (cfg.match) {
						if (typeof cfg.match === 'function') {
							try {
								if (cfg.match.call({}, node)) {
									config = cfg;
								}
							} catch (e) {
								// noop
							}
						} else if (typeof cfg.match === 'string' && [node.mainType, node.id, node.path].indexOf(cfg.match) !== -1) {
							config = cfg;
						}
					}
				});
				return config;
			};

			this.addConfig = function (config) {
				configs.push(config);
			};

			this.setConfigs = function (cfgs) {
				configs = cfgs;
			};
		};

		return {
			getInstance: function (configs) {
				return new Config(configs);
			}
		};
	}]);

})();
