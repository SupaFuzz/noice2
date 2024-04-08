# noiceARSRow.js
4/8/24 Amy Hicox  <amy@hicox.com>

This is an extension of noiceCoreRow, implementing an object model for ARS "tickets", which is to say a row in a database table with ARS server integrations provided by a noiceARSSyncWorkerClient / noiceARSSyncWorkerThread pair





## SYNOPSIS
```javascript

/*
    NOTE: this presumes your noiceARSSyncWorkerThread
    has already been spawned and initiailized and that
    you've already created a noiceARSSyncWorkerClient
    instance on the 'syncWorkerClient' variable
*/

// make a row object and load an existing record into it
let arsRecord = await new noiceARSRow({
    formName: "NOICE:TestForm",
    threadClient: syncWorkerClient,

    dataLoadedCallback: async(rowData, rowReference) => {
        rowReference.log(`data loaded!: `, rowData);
        return(rowData);
    }
}).load("000000000001275").catch((error) => {
    console.log(`failed to load: ${error}`);
});


/*
    NOTE: the above should've fired dataLoadedCallback
    here's where your data is:
*/
console.log(arsRecord.rowData);


// make a change, things'll go your way ...
arsRecord.modify({
    Status: "Closed",
    Assignee: "Squidward"
}).then((rowData) => {
    // rowData will have the row as was written including any mutations inserted by the client or thread
}).catch((error) => {
    console.log(`modify failed: ${error}`);
});

// make a new one!
let newARSRecord = new noiceARSRow({
    formName: "NOICE:TestForm",
    threadClient: syncWorkerClient,
    mode: 'create',

    rowData: {
        Status: 'Open',
        Assignee: 'Spongebob',
        Notes: "don't forget the pickles!"
    },

    // optional callbacks
    modeChangeCallback: (mode, oldMode, rowReference) => {
        // maybe setup a ui or adjust field params based on custom stuff what
        rowReference.log(`change mode from: ${oldMode} to ${mode}`);
    },

    dataLoadedCallback: async(rowData, rowReference) => {
        rowReference.log(`data loaded!: `, rowData);
        return(rowData);
    }
});

// create it in the db (add let the thread take care of syncin' it)
newARSRecord.save().then((rowData) => {
    console.log(`successfully created: ${newARSRecord.entryId}: `, rowData)
}).catch((error) => {
    console.log(`create failed: ${error}`);
});

/*
    the save should've triggered both the modeChangeCallback and
    the dataLoadedCallback (after the transaction wrote to db and refreshed values to catch
    any mutations inserted by the threadClient or syncWorker)
*/

```




## ATTRIBUTES

### `mode` enum('create', 'modify') default: 'modify'

determines the behavior of the `save()` function. In `create`, the mode will toggle to `modify` after a successful `save()`. When the value of this attribute changes, the `modeChangeCallback` will be executed (if specified)

### `modeChangeCallback` function(mode, oldMode, selfReference)

if specified, this synchronous callback will be executed when the value of the `mode` attribute changes value

### `entryId` string, default: null

returns the value of the `dataElement` where `id == 1`. AKA the "ticket number", aka the "request id", aka the "entry id", aka -- remedy's core primary key. This attribute is read/write -- for instance after the arsSyncWorkerThread dequeues and receives a legit value, etc.

### `dataLoadedCallback` async function (rowData, selfReference)

if specified, this asynchronous callback is executed *after* new values are set for the `load()` and `refresh()` functions.




## FUNCTIONS

### `getFieldByID(fieldID)`

returns the dataElement where the `.id` attribute == 'fieldID', else null

### `getFieldByName(fieldName)`

returns the dataElement where the `.fieldID` (bad attribute name, this is actually the `name` of the field in the ARS Form defintion) ... ok where *that* == `fieldName`, else null

### `getFieldNameByID(fieldID)`

returns the `.fieldID` (again bad attribute name -- this is the `name` attribute of the field in the ARS FieldConfig) of the dataElement where the `.id` attribute == `fieldID`

### `getFieldIDByName(fieldName)`

returns the `.id` attribute of the `dataElement` where the `.fieldID` attribute matches the given `fieldName`
NOTE: `.fieldID` is an unfortunate attribute name. This is the `name` of the field in the ars form def

### `initFormFields()`

pull the formDefinition corresponding to `this.formName` from the threadClient, and mutate it into a fieldConfig, then install that fieldConfig on the `.fieldConfig` attribute. This is called automatically from the constructor

### `load(entryId)`

load the row from the datastore corresponding to `this.formName` with the specified `entryId` into the object. Values will be available on `this.rowData`, and the `dataLoadedCallback()` will be executed if specified. Upon an error, will reject returned promise.

### `refresh(mergeChangesBool)`

if `mode:modify`, pull all of the data from the dbRecord identified by `this.entryId` updating all of the fields and *do not* set change flags true while doing so, as these represent the current state of the object in the db

if `mergeChanges` is set true, do not update the value of fields with the `changeFlag` active
simply update the values of fields where `changeFlag` is false

if dataLoadedCallback is specified,  call this *after* updating row values

### `saveCallback(rowData, selfRef)`

this is the hard-coded `saveCallback()` -- this writes data to either the `createARSRow()` or `modifyARSRow()` functions on the `noiceARSSyncWorkerClient` on a call to the `save()` function.
