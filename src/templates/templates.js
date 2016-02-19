angular.module("formula").run(["$templateCache", function($templateCache) {$templateCache.put("formula/default/array.html","<fieldset ng-class=\"{ valid: field.valid, error: field.errors }\"><legend>{{ field.title }} ({{ field.nrArrayValues() || 0 }})</legend><ul ng-if=\"::field.typeOf(\'fieldset\')\" ng-sortable=\"field.sortable\"><li ng-repeat=\"value in field.values\" ng-if=\"!value.hidden\"><fieldset ng-class=\"{ valid: value.valid }\"><legend><span ng-if=\"!value.visible\">{{ value.value | formulaInlineValues }}</span> <a ng-show=\"!$first\" class=\"toggle drag-handle\" href=\"\" ng-click=\"field.moveUp($index)\" ng-attr-title=\"{{ i18n.text.moveup }}\">&uarr;</a> <a ng-show=\"!$last\" class=\"toggle drag-handle\" href=\"\" ng-click=\"field.moveDown($index)\" ng-attr-title=\"{{ i18n.text.movedown }}\">&darr;</a> <a class=\"toggle\" href=\"\" ng-click=\"field.itemToggle($index)\" ng-attr-title=\"{{ value.visible ? i18n.text.minimize.tooltip : i18n.text.maximize.tooltip }}\">{{ value.visible ? \'_\' : \'‾\' }}</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" ng-attr-title=\"{{ i18n.text.remove.tooltip }}\">&times;</a></legend><formula:field field=\"value\" ng-if=\"value.visible\"></formula:field></fieldset></li></ul><ul ng-if=\"::field.typeOf(\'field\')\" ng-sortable=\"field.sortable\"><li ng-class=\"{ valid: value.valid, error: value.error }\" ng-repeat=\"value in field.values\"><input formula:input=\"\" field=\"value\"><div class=\"input-ctrls\"><a ng-show=\"!$first\" class=\"toggle drag-handle\" href=\"\" ng-click=\"field.moveUp($index)\" ng-attr-title=\"{{ i18n.text.moveup }}\">&uarr;</a> <a ng-show=\"!$last\" class=\"toggle drag-handle\" href=\"\" ng-click=\"field.moveDown($index)\" ng-attr-title=\"{{ i18n.text.movedown }}\">&darr;</a> <a class=\"remove\" href=\"\" ng-click=\"field.itemRemove($index)\" ng-attr-title=\"{{ i18n.text.remove.tooltip }}\">&times;</a></div></li></ul><div ng-if=\"field.errors\" title=\"{{ field.errors.join(\'\\n\') }}\">{{ i18n.text.invalid | formulaReplace : { count: field.errors.length } }}</div><div ng-if=\"!field.errors\">{{ field.description }}</div><div class=\"formulaArrayCtrls\"><button class=\"add\" ng-click=\"field.itemAdd()\" title=\"{{ i18n.text.add.tooltip }}\" type=\"button\"><strong>&plus;</strong> {{ i18n.text.add.label }}</button></div></fieldset>");
$templateCache.put("formula/default/field.html","<div ng-class=\"{ valid: field.valid, error: field.error, required: (field.required && field.value == null) }\" ng-if=\"field.visible\" title=\"{{ field.description }}\"><label for=\"{{ ::field.uid }}\">{{ field.title }} {{field.visibility}}</label><formula:input field=\"field\"></formula:input><span ng-if=\"field.error\">{{ field.getErrorText(field.error) }}</span> <span ng-if=\"field.description\">{{ field.description }}</span></div>");
$templateCache.put("formula/default/fieldset.html","<fieldset ng-show=\"fieldset.active\"><formula:fields fields=\"::fieldset.fields\"></formula:fields></fieldset>");
$templateCache.put("formula/default/form.html","<div><div class=\"formula\" ng-if=\"!form.ready\"><div class=\"loading\"><div class=\"spinner\"></div><span>Loading...</span></div></div><form class=\"formula\" ng-show=\"form.ready\"><header ng-if=\"::form.title\">{{ form.title }}</header><nav ng-if=\"::form.fieldsets.length > 1\"><a href=\"\" ng-class=\"{ active: fieldset.active, error: !fieldset.valid }\" ng-click=\"form.activate(fieldset)\" ng-repeat=\"fieldset in ::form.fieldsets track by fieldset.id\">{{ fieldset.title }}</a></nav><formula:fieldsets></formula:fieldsets><footer><span ng-if=\"form.errors\" title=\"{{ form.errors.join(\'\\n\') }}\">{{ i18n.text.invalid | formulaReplace : { count: form.errors.length } }}</span> <button ng-click=\"form.validate(true);\" ng-if=\"!data.hideButtons\" title=\"{{ i18n.text.validate.tooltip }}\"><strong>&#10003;</strong> {{ i18n.text.validate.label }}</button> <button ng-click=\"form.save()\" ng-disabled=\"!form.valid\" ng-if=\"!data.hideButtons\" title=\"{{ i18n.text.save.tooltip }}\"><strong>&#9921;</strong> {{ i18n.text.save.label }}</button></footer></form></div>");
$templateCache.put("formula/default/object.html","<fieldset><legend ng-if=\"::field.title\">{{ field.title }}</legend><formula:fields fields=\"::field.fields\"></formula:fields></fieldset>");}]);