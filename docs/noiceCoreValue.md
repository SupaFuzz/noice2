# noiceCoreValue.js
3/29/24 Amy Hicox  <amy@hicox.com>

This is an object model for a single value. This is the backend for a "field" with no UI or other data bindings. A group of these objects might define a row in a datastore, for instance.




## synopsis
```javascript
let coreValue = new noiceCoreValue({
    defaultValue: 'dork',
    nullable: false,
    editable: true,
    debug: true,
    validationStateChangeCallback: (hasErrors, hasWarnings, errors, slf) => {
        slf.log(`[validationStateChangeCallback]: errors: ${hasErrors} (${errors.filter((a)=>{return(a.severity=="error")}).length}), warnings: ${hasWarnings} (${errors.filter((a)=>{return(a.severity=="warning")}).length})`)
    },
    editableStateChangeCallback: (toBool, fromBool, slf) => {
        slf.log(`[editableStateChangeCallback] ${fromBool} -> ${toBool}`);
    },
    nullableStateChangeCallback: (toBool, fromBool, slf) => {
        slf.log(`[nullableStateChangeCallback] ${fromBool} -> ${toBool}`);
    },
    valueChangeCallback: (n, o, slf) => {
        return(new Promise((_t,_b) => {
            slf.log(`[valueChangeCallback] ${o} -> ${n}`);
            // demonstrate thine asyncrhony
            setTimeout(() => { _t(n); }, 100);
        }));
    },
    valueChangedCallback: async (n, o, slf) => {
        slf.log(`[valueChangedCallback] ${o} -> ${n}`);
        return(n);
    }
});

// get value of object
console.log(coreValue.value); // expected output: "dork"

// change value of object (blindly)
coreValue.value = "dweeb";

    // valueChangeCallback should fire here
    // valueChangedCallback fhouls also fire here

// change value of object (capture errors)
coreValue.setValue('dweeb').then((val) => {
    // if valueChangeCallback mutated the value, it's in 'val' now
    // also valueChangedCallback will have fired if you've found yourself in this block
    // if validation errors fired, validationStateChangeCallback will also have fired
}).catch((error) => {
    // if valueChangeCallback rejected, this block will fire
    // valueChangedCallback will not have fired if you're in this block
})

// revert last change
coreValue.undo().then((val) => {
    // val will have the current value (which is by the time you're in this block, the previous value)
}).catch((error) =>{
    // fill fire if valueChangeCallback rejected
})

// validate the value
coreValue.validate((valueIsOk) => {
    // valueIsOk will be true if all validation tests passed
    // validIsOk will be false if at least one validation test failed
    // validationCallback() is an externally defineable way of adding custom validation tests
    // to access validation errors and warnings see .errors attribute (details below)

}).catch((error) => {
    // technically should not happen. validation tests should not be capable of rejecting their promise
    // but for completeness, if something gets horked, this block will fire
})

```




## attributes

### `value` - any | default: null

the value the object bears (see also `setValue()` below)

### `valueChangeCallback` - async function(newValue, oldValue, seldReference)

if specified this asynchronous callback is executed each time the value of the `.value` attribute changes, *before* the value is changed. If the callback rejects it's promise, the value change is aborted. Whatever value the callback resolves to will be set as the new `.value` attribute (meaning this callback can mutate requested value changes if you need)

### `valueChangedCallback` -  async function(newValue, oldValue, selfReference)

if specified, this asynchronous callback is executed *after* the value has been set on the `.value` attribute. If the callback rejects it's promise, that is ignored. If the callback returns a different value, this too is ignored. This is executed asynchronously purely for symmetry with `valueChangeCallback`. This hook could be used for instance, to drive a UI subclass to indicate values that have been recently changed, etc.
.

### `undoValue` - any

the value of `.value` when the `changeFlag` was last false. NOTE: this is NOT "the last value", but "the last saved value"

### `previousValue` - any

this is the previous value of `.value`, which is to say inside the `valueChangeCallback` and `valueChangedCallback` this is
the "old value" in the arg list. This is initialized to `defaultValue`, and will hold the previous value on each subsequent change. For instance if my `defaultValue="red"`, and I change value to "green", `(previousValue =="red") == true`, if I subsequently change value to "blue", `(previousValue == "green") == true`, if I subsequently set `changeFlag = false` (indicating a save), `previousValue == "blue"`. ya dig? this is for change detection. and `undoValue` is for `undo()`.

### `changeFlag` - bool | default: false

this attribute is individually addressable, meaning you can manually set it false or true if needed, however, the value will automatically set `true` when `.value` changes and `.undoValue !== .value`. When the value of `.changeFlag` changes, the `changeFlagCallback()` will be invoked if specified

when `changeFlag` is set from `true` to `false` and the `.undoValue !== .value` condition is true, we copy `.value` into `.undoValue`
which is to say `undoValue` is set either from `.defaultValue` at instantiation, or by explicitly setting `.changeFlag = false` while `.undoValue !== .value`

### `changeFlagCallback` - function(changeFlag, previousChangeFlag, selfReference)

if specified, this function is invoked when the value of the `.changeFlag` attribute changes. This function call is synchronous and throws are ignored

### `nullable` - bool | default: false

if set true and `.value` is set to a null value (as defined by `noiceCoreUtility.isNull()`), a a validation error (`messageNumber: 1 | a value is required`) is appended to the `.errors` object. Additionaly, the `nullableStateChangeCallback()` function is invoked (if specified) when the `nullable` bool changes values (this hook could enable visual indication of a 'required' field in a UI sublass, for instance).

### `nullableStateChangeCallback` - function(nullable, previousNullable, selfReference)

if specified, this synchronous function is invoked when the `.nullable` attribute changes value

### `values` - array | default: []

if specified, this is a list of  values for the `.value` attribute. This could (for instance) be a list of values for a UI renderer to make a typeahead or dropdown menu. If the `.enforceMenuValues` bool is set true, and `.value` changes to a value *not* in the `.values` array, a validation error (`messageNumber: 2 | invalid value`) is appended to the `.errors` object

### `enforceMenuValues` - bool | default: false

if set true and `.values` has at least one value, will trigger a validation error (`messageNumber: 2 | invalid value`) if `.value` does not matcha a value in the `.values` array

### `validateOnChange` - bool | default: true

if set true, automatically call the `validate()` function when the `.value` attribute changes

### `errors` - array | default: []

if there are validation errors or warnings, they will be inserted into this array (as a `noiceException` object)

### `hasErrors` - bool | default: false

if there are > 0 `noiceException` objects in `.errors` where `noiceException.severity == "error"`, this attribute will be `true`, otherwise `false` (obviously)

### `hasWarnings` - bool | default: false

if there are > 0 `noiceException` objects in `.errors` where `noiceException.severity == "warning"`, this attribute will be `true`, otherwise `false` (totes obvz)

### `validationStateChangeCallback` - function(hasErrors, hasWarnings, errors, selfRef)

if specified, this synchronous callback is executed each time a call is made to `addValidationError()` or `removeValidationError()`. `hasErrors` & `hasWarnings` are bools corresponding to value of the same-named  attributes listed above. `errors` is a pointer to the `this.errors` array and `selfRef` is a reference to `this`

### `editable` - bool | default: true

if set `true`, the `.value` attribute is mutable. Otherwise attempts to change `.value` are ignored

### `editableStateChangeCallback` - function(editable, oldEditable, selfRef)

if specified, this synchronous callback is executed when the value of `.editable` is changed. This hook for instance can be used to toggle visual indicators of editable fields in a UI subclass.

### `defaultValue` - any

if specified at instantiation, the object is "born" with `.value` set to this value. no callbacks will be executed for this change.

### `validationCallback` - function(value, selfRef)

if specified, this callback is executed from the `validate()` function, and its output chained to built in `nullable` and `enforceMenuValues` validations.

### `attributeChangeCallback` - function(name, value, oldValue, selfRef)

if specified, this is called from `setAttribute()` when setting a new attribute value


## functions

### `async setValue(value, bypassBool)`

this function changes the value of `.value`, returning a promise resolving to the new value of `.value` (which may not be the same as the `value` argument sent into the function). This will execute the `valueChangeCallback()` (if specified) and await the resolved value to set on `.value`. If `valueChangeCallback` rejects it's promise, the value change will be aborted. If the `bypassBool` argument is set `true`, we execute *no callbacks* merely, directly setting both `._value` and `._undoValue` to the given value and setting the `._changeFlag` to false.

### `async undo(bypassBool)`

this will revert `.value` to `.undoValue` when executed. If `bypassBool` is set `true`, will pass to the `setValue()` function, bypassing callbacks on the change.

### `async validate()`

this asynchronous function executes validation checks against `.value`, inserting or removing validationErrors and validationWarnings from the `.errors` array (in turn, triggering validationStateChangeCallback() if specified).

This function is called automatically from `setValue()` *if* the `.validateOnChange` bool is set true

### `validateNullable()`

this function executes the inbuilt `nullable` validation (see above) - this is called internally from `validate()`

### `validateEnforceMenuValues()`

this function executes the inbuilt `enforceMenuValues` validation (see above) - this is called internally from `validate()`

### `addValidationError({})`

this function constructs a `noiceException` object from the input object and appends it to the `.errors` array - invoking 'validationStateChangeCallback()' if specified required attributes on the input object: 'messageNumber': <int>, 'message': <str>, `severity`: <enum: 'warning', 'error'>

### `removeValidationError(messageNumber)`

remove all objects in the `.errors` array where `.severity` == "error" and `.messageNumber` == the 'messageNumber' input argument, then call 'validationStateChangeCallback()' if specified

### `clearValidationErrors()`

remove all objects in `.errors` where `.severity == "error"`, then call 'validationStateChangeCallback()' if specified

### `clearValidationWarnings()`

remove all objects in `.errors` where `.severity == "warning"`, then call 'validationStateChangeCallback()' if specified

### `setAttribute(name, value)`

sets the attribute identified by `name` to the given `value`. If `attributeChangeCallback()` is present, it is invoked
