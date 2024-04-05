# noiceCoreRow.js
4/3/24 Amy Hicox  <amy@hicox.com>

This is an object model for a collection of related noiceCoreValue objects. Where noiceCoreValue objects  might abstract "columns", noiceCoreRow objects abstract a row.




## SYNOPSIS
```javascript
let coreRow = new noiceCoreRow({
    rowData: {
        entryId:    '000000000000001',
        status:     "I'm Ready",
        createDate: 1712023281,
        user:       'sbsquarepants',
        subject:    'you forgot the pickles'
    },
    fieldConfig: {
        status: {
            values: ["I'm Ready", "Open", "Closed"],
            enforceMenuValues: true,
            nullable: false
        },
        createDate: {
            type: "TIME",
            storeAs: 'epoch',
            showAs: 'dateTimeLocale',
            nullable: false
        },
        user: {
            type: "AUID",
            storeAs: "auid",
            showAs: "full name",
            nullable: false
        },
        subject: {
            nullable: false
        },
        entryId: {
            type: 'char',
            maxLength: 15,
            nullable: false
        }
    },
    changeFlagCallback: (changeFlag, oldChangeFlag, selfRef) => { ... },
    saveCallback: async(rowData, selfRef)=>{ return(rowData); },
    saveOnChange: true
});

// modify the row
coreRow.modify({
    status: "FAKE",
    subject: "this should generate an error!",
    user: 'squidward'
}).then((rowData) => {
    // rowData contains post-modify row
    // since saveOnChange is set, this has been saved and changeFlag reset false
    console.log(`modified row: `, rowData);
}).catch((error) => {
    // if failed will be validation error or saveCallback()
    if (error == 'row has validation errors'){
        console.log(`validation errors`, coreRow.validationErrors);
    }else{
        // more than likely saveOnChange:true so save() failed
        // but could be other callbacks as well
        console.log(error)
    }
});

// validate the row
coreRow.validate().then((rowIsOk) => {
    console.log(`Row ${rowIsOk?'Passed':'Failed'} Validation`);
}).catch((error) => {
    // shouldn't really happen but a validationCallback might throw I suppose
    console.log(`validate() threw: ${error}`);
})


// manually save the row (for instance if saveOnChange: false)
coreRow.save().then((rowData) => {
    console.log(`success. saved row: `, rowData);
}).catch((error) => {
    console.log(`save failed: ${error}`);
})

// does the row have unsaved changes?
console.log(`row ${coreRow.changeFlag?'does':'does not'} have unsaved changes`);

// do something when the changeFlag changes state
coreRow.changeFlagCallback = (changeFlag, oldChangeFlag, selfReference) => {
    selfReference.log(`[changeFlag toggled] ${oldChangeFlag} -> ${changeFlag}`);
}

// get changed fields
if (coreRow.changeFlag){
    console.log(`row has unsaved changes: `, coreRow.changedFields);
}

// does the row have validationWarnings?
if (coreRow.hasWarnings){
    console.log(`warnings: `, coreRow.validationWarnings);
}

// does the row have validationErrors?
if (coreRow.hasErrors){
    console.log('errors: ', coreRow.validationErrors);
}
```




## ATTRIBUTES

### `rowData` | object | read-write

this attribute is an object of the form `{<fieldID>:<value>, ...}`. Setting the value of this object will delete all existing `dataElements`, and generate new `noiceCoreData` objects corresponding to each distinct `fieldID` value. If the `fieldID` value matches an entry on the `fieldConfig` attribute, those properties will be merged into the resulting `noiceCoreData` object (so for instance `values`, `nullable`, `editable`, and other extended validationCallbacks, etc can be specified on the `fieldConfig` attribute). Getting this attribute returns an object in the same form as the input with current field values

### `fieldConfig` | object | read-write

this attribute is an object of the form `{<fieldID>:{ <attribute>:value, ...}, ...}` this input sets attributes on `dataElements` with corresponding `fieldID` values. This can be updated after instantiation and new configurations will be fed to matching fieldIDs in dataElements. At this base class level, only the default `noiceCoreValue` attributes are supported. If extended this could of course, contain all kinda things including callbacks

### `dataElements` | object | read-only

this is an object of `noiceCoreValue` objects corresponding to each distinct key in the `rowData` attribute. The object is of the form  `{ <fieldID>:<noiceCoreValue>, ...}`.

### `hasDataElements` | bool (default: false)

this attribute is `true` if the number of `noiceCoreValue` objects on the `dataElements` attribute matches the number of fields on the `rowData` attribute (basically to answer the question: have we initialized `rowData` yet?);

### `changeFlag` | bool (default: false)

if any `dataElement` has an active changeFlag, this value is `true`, else `false`

### `changeFlagCallback` | function(changeFlag, oldChangeFlag, selfReference)

when the `changeFlag` toggles, this synchronous callback is executed with the above parameters if specified.

### `changedFields` | object (default: {})

returns an object of the form: `{ <fieldID>:{ value: <value>, oldValue: <value>, fieldReference: <noiceCoreData>}, ...  }` containing fields with `changeFlag` set `true`

### `hasErrors` | bool (default: false)

is `true` if any `dataElement` has validation errors.

### `validationErrors` | object (default: {})

if `hasErrors` == `true`, this will contain an object of the form:
`{ <fieldID>:[<noiceException>, ...], ... }`

### `hasWarnings` | object (default: false)

is `true` if any `dataElement` has validation warnings.

### `validationWarnings` | object (default: {})

if `hasWarnings` == `true`this will contain an object of the form:
`{ <fieldID>:[<noiceException>, ...], ... }`

### `saveOnChange` | bool (default: true)

if `true`, calls to `modify()` will automatically invoke the `save()` function

### `saveCallback` | async function(rowData, selfRef)

if specified, the `save()` function will await output of this function before clearing the `changeFlag` on the row object as well as all of the component `dataElements` objects. This is how you hook up an actual save to like indexedDB or the network or whatever.

### `logCallback` | function(string)

if specified, log statements will be sent to this function rather than `console.log`

### `debug` | bool (default: false)

if set `true`, will log more. else will log less.

### `addDataElementCallback` | async function(noiceCoreValue)

if specified, is called and awaited from `getDataElement` when a new dataElement is spawned

### `removeDataElementCallback` | async function(noiceCoreValue)

if specified, is called and awaited before removing a dataElement via the `removeDataElement()` function. Promise rejects are ignored. 


## FUNCTIONS

### `log(str, debugOnlyBool)`

a function needs to write a log string. If `debugOnlyBool` is set `true`, only actually log if `this.debug` is set `true`. If `logCallback` is specified strings will be written to that rather than `console.log`

### `async save(forceBool)`

executes `validate()`, if that finds errors, aborts (rejects promise) unless `forceBool` is set true. Once Validation is passed, will await `saveCallback()` if specified, once that completes, we reset the row's `changeFlag` as well as all of the changeFlags on the component `dataElements`. I `forceBool` was set hot, this also clears all validationErrors and validationWarnings. On success the promise resolves to `this.rowData`

### `async modify(fieldValues)`

changes the value of one or more fields on `dataElements`, invoking `valueChange()` and the other callbacks. If
`this.hasErrors == true` after modifying the field values, the function will reject the promise with the string `row has validation errors`, else if `this.saveOnChange == true` the function will automatically invoke `save()` awaiting it's output before resolving the promise to `this.rowData`.

### `async validate()`

invokes `noiceCoreData.validate()` on each field on `dataElements`, resolving `true` if no fields have validation errors after and `false` if at least one field has a validation error.


### `fieldChangeFlagToggle({fieldID: <colName>, changeFlag: <bool>, oldChangeFlag: <bool>, fieldReference: <noiceCoreValue>})`

internal function, is the changeFlagCallback for each field on `dataElements`

the changeFlag has been *potentially* affected in a field in this.dataElements -= to be sure, check old != new values
also update this.changeFlag from here, which allows the this.changeFlagCallback to do it's thing.
UI subclasses may want to inject something here for updating changed field visual status


### `fieldNullableStateChange({ fieldID: <colName>, editable: <bool>, oldEditable: <bool>, fieldReference: <noiceCoreValue>})`

internal function is a stub. child classes may wish to override this as a UI hook for updating the visual state of fields when the `nullable` bool attribute toggles value

### `fieldEditableStateChange({ fieldID: <colName>, editable: <bool>, oldEditable: <bool>})`

internal function is a stub. child classes may wish to override this as a UI hook for updating the visual state of fileds when the `editable` vool attribute toggles value

### `fieldValidationStateChange({ fieldID: <colName>, hasErrors: <bool>, hasWarnings: <bool>, errors: <array>, fieldReference: <noiceCoreValue Object> }`

internal function is a stub. child classes may wish to override this as a UI hook for updating the visual state of fileds when the `hasErrors` or `hasWarning` bool attributes toggle value. This will get called each time a validation error or warning is added or removed from a field on `dataElements`

### `async valueChange({ fieldID: <colName>, newValue: <val>, oldValue: <val>, fieldReference: <noiceCoreValue object> })`

internal function is a stub. child classes may wish to override this for the purposes of implementing "workflow" which is to say reactive logic that fires as fields change value. This is the valueChangeCallback for every field in `dataElements`. Rejecting this promise will abort the field value change. You can also mutate the input value, whatever value you resolve from this callback will be placed on the `dataElements` field idenfified by `fieldID`

### `async valueChangePostHook({ fieldID: <colName>, newValue: <val>, oldValue: <val>, fieldReference: <noiceCoreValue object> })`

internal function is a stub. child classes may wish to override this for the purposes of executing logic triggered by field value changes *after* the value has been set. This function is asynchronous for symmetry to `valueChange()` however, the resolution or rejection status of the returned promise is ignored. This is mostly useful for updating UI states as a result of a successful field change, etc.

### `getDataElement(fieldID, defaultValue)`

this returns the dataElement on this.dataElements, corresponding to colName
if no matching dataElement is found this will create a new one, and return that
append it to this.dataElements (that's on the caller)

if we had to create the dataElement and addDataElementCallback is specified, we call that

### `removeDataElement(fieldID)`

removes the noiceCoreValue object identified by `fieldID` from the `this.dataElements` attribute. If `removeDataElementCallback` is specified, we will await resolution/rejection before deleting the dataElement. However promise rejections are ignored and the dataElement is still deleted regardless.
