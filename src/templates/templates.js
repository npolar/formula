angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/default.html","<!DOCTYPE html><form class=\"formula\" ng-if=\"form.fieldsets\"><header ng-if=\"::form.title\">{{ ::form.title }}</header><nav ng-if=\"::form.fieldsets.length > 1\"><a href=\"\" ng-class=\"{ active: fieldset.active }\" ng-click=\"form.activate(fieldset)\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\">{{ fieldset.title }}</a></nav><fieldset ng-if=\"fieldset.active\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\"><div formula:field-definition=\"\" ng-repeat=\"field in ::fieldset.fields track by field.id\" ng-if=\"field.visible\"><div ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value == null) }\" ng-if=\"::field.typeOf(\'input\')\" title=\"{{ field.description }}\"><label for=\"{{ ::field.uid }}\">{{ field.title }}</label> <input formula:field=\"field\"> <span>{{ field.error.message || field.description }}</span></div><div ng-if=\"::field.typeOf(\'object\')\"><fieldset formula:field=\"field\"><legend ng-if=\"::field.title\">{{ field.title }}</legend><div ng-repeat=\"field in ::field.fields track by field.id\" ng-if=\"field.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></fieldset></div><div ng-if=\"::field.typeOf(\'array\')\"><div formula:field=\"field\"><fieldset ng-class=\"{ valid: field.valid, error: field.errors }\"><legend>{{ field.title }} ({{ field.nrArrayValues() || 0 }})</legend><ul ng-if=\"::field.typeOf(\'fieldset\')\"><li ng-repeat=\"value in field.values track by value.path\" ng-if=\"!value.hidden\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.fields | formulaInlineValues }}</span> <a class=\"toggle\" href=\"\" ng-click=\"field.itemToggle($index)\" title=\"{{ value.visible ? form.i18n.minimize[1] : form.i18n.maximize[1] }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></legend><div ng-repeat=\"field in ::value.fields track by field.id\" ng-if=\"value.visible\"><formula:field-instance field=\"field\"></formula:field-instance></div></fieldset></li><li><span ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: field.errors.length } }}</span> <span ng-if=\"!field.errors\">{{ field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ form.i18n.add[1] }}\" type=\"button\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul><ul ng-if=\"::field.typeOf(\'field\')\"><li ng-class=\"{ valid: value.valid, error: value.error }\" ng-repeat=\"value in field.values track by value.path\"><input formula:field=\"value\"> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" title=\"{{ form.i18n.remove[1] }}\">X</a></li><li><span ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: field.errors.length } }}</span> <span ng-if=\"!field.errors\">{{ field.description }}</span> <button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ form.i18n.add[1] }}\" type=\"button\"><strong>+</strong> {{ form.i18n.add[0] }}</button></li></ul></fieldset></div></div></div></fieldset><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ form.i18n.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-click=\"form.validate(true);\" ng-if=\"!data.hideButtons\" title=\"{{ form.i18n.validate[1] }}\"><strong>&#10003;</strong> {{ form.i18n.validate[0] }}</button> <button ng-click=\"form.save()\" ng-disabled=\"!form.valid\" ng-if=\"!data.hideButtons\" title=\"{{ form.i18n.save[1] }}\"><strong>&#9921;</strong> {{ form.i18n.save[0] }}</button></footer></form><div class=\"formula\" ng-if=\"!form.fieldsets\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div>");}]);