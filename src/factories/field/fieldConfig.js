/* globals angular */
angular.module('formula').factory('formulaFieldConfig', [function() {
  "use strict";

  var Config = function(cfgs) {
    var configs = cfgs || [];

    var isMatch = function(node, cfg) {
      var match = false;
      if (cfg.match) {
        if (typeof cfg.match === 'function') {
          try {
            if (cfg.match.call({}, node)) {
              match = true;
            }
          } catch (e) {
            // noop
          }
        } else if (typeof cfg.match === 'string' && [node.mainType, node.id, node.path].indexOf(cfg.match) !== -1) {
          match = true;
        }
      }
      return match;
    };

    this.getMatchingConfig = function(node) {
      var config;
      var last = configs.length - 1;
      for (var i = last; i >= 0; i--) {
        if (isMatch(node, configs[i])) {
          config = configs[i];
          break;
        }
      }
      return config;
    };

    this.addConfig = function(config) {
      configs.push(config);
    };

    this.setConfigs = function(cfgs) {
      configs = cfgs;
    };

    this.isMatch = function(node, cfg) {
      return isMatch(node, cfg);
    };
  };

  return {
    getInstance: function(configs) {
      return new Config(configs);
    }
  };
}]);
