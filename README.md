formula
=======

Generic JSON Schema form builder using Angular

For useage examples, check out the [Formula demo](http://npolar.github.io/formula/demo/) webpage.


## Dependencies
* [AngularJS](https://angularjs.org/) (1.3.x)
* [tv4.js](https://github.com/geraintluff/tv4/)


## Bootstrapping
Bootstrapping is done using the **formula** directive, which takes one *object* as a parameter, currently supporting the following properties:

* **schema** - URL to a JSON Schema used for form-building and validation *(mandatory)*
* **form** - URL to a JSON Schema used to customise the form layout
* **language** - URL to a JSON translation file used for form translations
* **model** - Object used to store form data
* **template** - String representing the form template layout name used for form-building


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
 * **text input** otherwise


## Supported string formats
* **color** for CSS 2.1 colors
* **date** for ISO 8601 date
* **date-time** for ISO 8601 date-time combindations
* **time** for ISO 8601 time
* **uri** for RFC 3986 uniform resource identifier
