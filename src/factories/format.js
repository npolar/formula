/* globals angular */
angular.module('formula').factory('formulaFormat', [function() {
  "use strict";

  return {
    color: // CSS 2.1 color
      function(data, schema) {
      var colors = "aqua,black,blue,fuchsia,gray,green,lime,maroon,navy,olive,orange,purple,red,silver,teal,white,yellow";

      if (typeof data === 'string') {
        // TODO: rgb-colors restricted to values between 0 and 255 (inclusive)
        if (colors.split(',').indexOf(data.toLowerCase()) !== -1 || /^(#([a-f0-9]{3}|[a-f0-9]{6})|rgb\(\s?\d{1,3}%?,\s?\d{1,3}%?,\s?\d{1,3}%?\s?\))$/i.test(data)) {
          return null;
        }

      }

      return 'CSS 2.1 color';
    },
    date: // ISO 8601 date
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}(-\d{2}){2}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 date, e.g. 2015-11-30 (year-month-day)';
    },
    datetime: // ISO 8601 datetime combination
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}(-\d{2}){2}T\d{2}(:\d{2}){2}(.\d+)?(([+-](\d{2}|\d{4}|\d{2}:\d{2}))|Z)$/.test(data)) {
        return null;
      }

      return 'ISO 8601 datetime, e.g. 2015-11-30T23:45:30Z';
    },
    yearmonth: // ISO 8601 date (without day)
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}-\d{2}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 date without day fraction, e.g. 2016-01 (year-month)';
    },
    year: // ISO 8601 four-digit year
      function(data, schema) {
      if (typeof data === 'string' && /^\d{4}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 four-digit year, e.g. 2015';
    },
    email: // RCF 3696 email
      function(data, schema) {
      var local = /^[-+a-z0-9!#$%&'*=?^_`{|}~\/]([-+a-z0-9!#$%&'*=?^_`{|}~\/]|\.(?!\.)){0,62}[-+a-z0-9!#$%&'*=?^_`{|}~\/]$/i,
        domain = /^[-a-z0-9]([-a-z0-9]|\.(?!\.)){0,253}[-a-z0-9]$/i, // TODO: IPv4 and IPv6 support
        comment = /\(.*\)/g,
        parts = (typeof data === 'string' ? data.split('@') : []);

      if (parts.length === 2 && data.length <= 254) {
        if (local.test(parts[0].replace(comment, '')) && domain.test(parts[1].replace(comment, ''))) {
          return null;
        }
      }

      return 'RCF 3696 e-mail address';
    },
    time: // ISO 8601 time
      function(data, schema) {
      if (typeof data === 'string' && /^\d{2}(:\d{2}){2}$/.test(data)) {
        return null;
      }

      return 'ISO 8601 time, e.g. 23:45:30';
    },
    uri: // RFC 3986 URI
      function(data, schema) {
      if (typeof data === 'string' && /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i.test(data)) {
        return null;
      }

      return 'RFC 3986 URI';
    }
  };
}]);
