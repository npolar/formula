formula
=======

Generic JSON Schema form builder using Angular

For useage examples, check out the [Formula demo](http://npolar.github.io/formula/demo/) webpage.


## Dependencies
* [AngularJS](https://angularjs.org/) (^1.4.7)
* [tv4.js](https://github.com/geraintluff/tv4/)


## Bootstrapping
Bootstrapping is done using the **formula** directive, which takes one *object* as a parameter, currently supporting the following properties:

* **schema** - URL to a JSON Schema used for form-building and validation *(mandatory)*
* **form** - URL to a JSON Schema used to customise the form layout
* **language** - URL to a JSON translation file used for form translations
* **model** - Object used to store form data
* **template** - String representing the form template layout name used for form-building
* **templates** - Object to configure custom field templates

### Custom Templates
Custom templates is configured like this:
```
templates: [{
  match(field) {
      return field.id === "ref_object";
    },
    templateUrl: 'customObject.html',
    //template: '<p>{{field.title}}</p>'
}]
```

## Templates
The following layout templates are bundled with Formula:

* **default** used together with the [formula](dist/formula.css) ([minified](dist/formula.min.css)) stylesheet
* **bootstrap3** used together with the [Bootstrap (v3)](http://getbootstrap.com/) stylesheet


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
 * **autocomplete** if the *autocomplete* property in set for *string* fields (in a separate form definition)
 * **text input** otherwise


## Supported string formats
* **color** for CSS 2.1 colors
* **date** for ISO 8601 date
* **date-time** for ISO 8601 date-time combinations
* **time** for ISO 8601 time
* **uri** for RFC 3986 uniform resource identifier


### Autocomplete
Autocomplete is available for string fields and is configured in the form definition in any of these ways:

    {
      "id": "autocomplete_array",
      "autocomplete": ["Dalene", "Allan"] <- static array
    },
    {
      "id": "autocomplete_url",
      "autocomplete": "//api.npolar.no/" <- GET returns array
    },
    {
      "id": "autocomplete_fn",
      "autocomplete": "foobar" <- function returns array
    },
    {
      "id": "autocomplete_obj",
      "autocomplete": {
        "source": "http://api.npolar.no/publication/?q=&fields=people.email&format=json&variant=array&limit=5",
        "callback": "emailCallback" <- callback returns array
      }
    }

Callback functions are defined via ```formulaAutoCompleteService``` like so:

    formulaAutoCompleteService.defineSourceFunction("emailCallback", function (response) {
      // return a array here
    });

If the source is an url new results will be fetched with ```?q=value``` for each input change.
