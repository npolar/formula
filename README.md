# formula

Generic JSON Schema form builder using Angular

For usage examples, check out the [Formula demo](http://npolar.github.io/formula/demo/) webpage.


## Dependencies
* [AngularJS](https://angularjs.org/) (^1.4.7)
* [tv4.js](https://github.com/geraintluff/tv4/)


## Bootstrapping
Bootstrapping is done by using the **'formula'** service to create a instance. This is then passed into to **&lt;formula&gt;** directive as configuration.

```JavaScript
  $scope.formula = formula.getInstance(options);
```

```html
  <formula options="formula"></formula>
```

### Options
* **schema**\* - [url] JSON schema
* **form** - [url, Object], form layout config
* **language** - [String] language code
* **languages** - [Array] languages
* **model** - [Promise, Object] JSON document
* **keepFailing** - [Boolean], to keep properties with failing conditions in model or not (default: true)
* **templates** - [Object] templates
* **onsave** - [Function] onsave function
* **confirmDirtyNavigate** - [Function (navigate)] function with one argument, a function to proceed with blocked navigation.

#### options.form
Config to set form title, group properties into fieldsets, override schema type, set formats and visibility conditions.


```json
{
	"title": "Form title",
	"fieldsets": [
		{
			"title": "First fieldset",
			"fields": [
				"schemaPropertyX",
				{
					"id": "schemaPropertyY",
					"type": "textarea",
					"condition": ["schemaPropertyX!='something'"]
				}
			]
		},
		{
			"title": "Second fieldset",
			"fields": [
				...
			]
		}
	]
}

```

In special use cases you might want to have the same field rendered multiple times. To be able to differentiate between multiple instances of the same field you can set the ```instance``` property in the form definition to something unique.

#### options.languages
Languages is configured like this:

```js
languages: [{
  code: 'en',
  aliases: ['en_GB'],
  uri: 'uri to translation file',
  //map: translation object
}]

```

See demo/json/no.json for example translation file

#### options.templates####
Templates is configured like this:

```JavaScript
templates: [
  {
    match: function(field) {
      return field.id === "ref_object";
    },
    // match: 'form|fieldset|field'
    // match: 'field.id'
    // match: '#/field.path'
    templateUrl: 'customObject.html',
    //template: '<p>{{field.title}}</p>',
    //template: '',
    //hidden: true
  }, {
    ...
  }
]
```

If you are defining your own template you need to provide at least one with ```match: 'form'```, one with ```'fieldset'``` and one with ```'field'```.

Templates are evaluated in LIFO order!
All templates can have one root element only.

The matched template can be overridden by setting the ```template``` property directly on any node.

### The service instance
The instance you get from bootstrapping (```formula.getInstance()```) has the following API:

    formula.setModel(model)
Set data model

    formula.getModel()
Get data model

    formula.setForm(formDefinition)
Set form definition

    formula.setOnSave(saveCallback)
Set save callback

    formula.setConfirmDirtyNavigate(confirmFunction)
Set confirmDirtyNavigate function. confirmFunction is called with one argument, a function to proceed with blocked navigation.

    formula.save()
Exec save

    formula.getSchema()
Get dereferenced schema, returns a promise

    formula.getFieldByPath(jsonPath)
Get field by json path, returns a promise

    formula.getFields()
Get all fields, returns a promise

    formula.i18n.add(lang, code, [aliases])
Add language. lang can be either a uri or a object. See i18n/no.json for example translation. Aliases is an array of alternative language codes. E.g. 'en' might have 'en-GB' and 'en-US' as aliases. Setting either code will resolve to 'en'. Returns a promise.

    formula.i18n.set(code)
Set language

    formula.i18n.code
Getter for current language code

    formula.setTemplates(templates)
Set templates

    formula.addTemplate(template)
Add a template

    formula._cfg
Config object to pass to formula directive.

## Supported types
* **any** rendered as:
 * **text input** which automatically recognises **boolean**, **number** and **array** types
* **array** rendered as:
 * **fieldset array** if the *items type* property is set to *object*
 * **field array** if the *items type* property is set to a basic JSON Schema type
 * **multiple select** if the *items enum* property is set
* **boolean** rendered as:
 * **checkbox input**
* **integer** and **number** rendered as:
 * **range input** if *type* property is set to *range* (in a separate form definition)
 * **select** if the *enum* property is set
 * **number input** otherwise
* **null** which is simply not rendered
* **object** which is rendered as a fieldset
* **string** rendered as:
 * **date input** if the *format* property is set to *date*
 * **datetime input** if the *format* property is set to *date-time*
 * **time input** if the *format* property is set to *time*
 * **textarea** if the *type* property is set to *textarea* (in a separate form definition)
 * **number input** if the *format* property is set to *utc-millisec*
 * **select** if the *enum* property is set
 * **text input** otherwise


## Supported string formats
* **color** for CSS 2.1 colors
* **date** for ISO 8601 date
* **date-time** for ISO 8601 date-time combinations
* **time** for ISO 8601 time
* **uri** for RFC 3986 uniform resource identifier

## Config service
If you need to configure something on a per-field basis you can use **'formulaFieldConfig'** in a similar way as in ```options.templates```.

```js
  var configs = formulaFieldConfig.getInstance([
    {
      match: [String/Function],
      options ...
    }
  ])
```

You can then use this configset like so:
```js
  configs.getMatchingConfig(field);
  configs.isMatch(field, config);
  configs.setConfigs(configs);
  configs.addConfig(config);
```
