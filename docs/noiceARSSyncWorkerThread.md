# noiceARSSyncWorker.js
You have a BMC Remedy AR Server, and you have a web application (perhaps a mobile PWA) that needs to talk
to said Remedy server -- however, that application may or may not have network connectivity at any given
time and the network reachability of the Remedy server needs to *not* impede the user experience.

One solution to that problem would be to implement a *local copy* of all of the Forms that the application
needs to access in order to do what it needs to do. The application can then write transactions to the local
dataStore, and they can be periodically dequeued and transmitted inside a process that syncs the local dataStore
to the server on intervals.

This arrangement is of course, not without challenges as transactions thought to be complete by the user, may
in fact generate server-side errors that require user attention at the time they are finally transmitted.
However, while somewhat cumbersome, this is not an insurmountable issue.

noiceARSSyncWorker is an extension class of noiceWorkerThread, that solves the first part of this problem.
That is, creating a local database and syncing the contents of selected forms on intervals.


## Configuration
The `config` attribute is passed to the object constructor, which controls which forms are synced to the local
database, which fields are index-searchable and various other options. The `config` object has this general structure:

```javascript
{
    mainLoopInterval: '<int (seconds)>',
    queryListByteLimit: '<int (bytes)>',
    threadMessageLimit: '<int (milliseconds)>',
    apiConnect: {
        user: '<str>',
        password: '<str>',
        proxyPath: '<str>'
    },
    dbConfig: {
        dbName: '<str>',
        dbVersion: '<int>',
        storeDefinitions: {} // see detail below
    }
}
```

* **`mainLoopInterval` integer (seconds)**

    the thread has a mainLoop which runs every `mainLoopInterval` seconds. This is executed by the `invokeMainLoop()` function which upon completion executes a `setTimeout()` that recursively executes `invokeMainLoop()` at the next interval. This is *not necessarily* the same thing as how often we sync data. Each form configured on `dbConfig.storeDefinitions` will define a `syncInterval` (milliseconds). For each configured form, we will check the `syncInterval` every `mainLoopInterval` seconds, and sync data for that form appropriately.

* **`queryListByteLimit` integer (bytes)**

    this is the maximum length of a QBE string used on the `query()` function of the REST API. For certain operations, we need to execute very large queries. For instance in the case of the `handlePrune()` function, we need to verify the existence of every record in the local dataStore on the server. To do that, in a network efficient way, we need to construct a query like
    `'1'="<entryId>" OR '1'="<entryId>" OR 1'="..."` which can get quite long. In typical BMC fashion,
    they modeled the `query()` REST endpoint as a `GET`, meaning the query string itself must be endcoded on the URL.

    The problem is that eventually you're going to taste the wrath of [HTTP/414](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414). While the HTTP/414 error is part of the WC3 standard, the actual URL length limit is configured by the jetty server embedded within your AR Server (which is configurable), also this can be limited by a reverse proxy configuration (which you will almost certainly have in your network path if you are writing an external web app like this). SO there is no standard hard limit here, and that's why it has a configuration option. Anecdotally, a value of `3000` seems to work well. In situations where the thread needs to execute potentially massive queries, we will use this limit to construct the minimum number of queries to retrieve the
    requested rows without violating `queryListByteLimit`, execute them then join the query results.

* **`threadMessageLimit` integer (milliseconds)**

    the thread will send status updates to the main thread via the `noiceWorkerThread.statusUpdate()` mechhanism. In the case of sending updates inside loops for instance, it is quite possible to smurf your main thread (blocking every event loop with a message from a child thread essentially locking the main UI thread for the user). To mitigate this possibility, the `threadMessageLimit` cofigures the minumum number of miliseconds that must elapse between sending notifications to the main thread.

* **`apiConnect` object**

    this object defines connection parameters for the `noiceRemedyAPI` object constructor. By default we will set `hostname` and `protocol` from the url on which the webapp is served though you can override those defaults here as well as setting `user`, `password` and `proxyPath` options here.

* **`dbConfig` object**

    this is a `noiceIndexedDB.storeDefinitions` object describing the indexedDB instance the thread will instantiate as well as each of the dataStore tables within it, the searchable indexes, etc. It is all of that you'd normally expect, *plus a whole lotta other stuff* that controls how/when data is synced from the server.

    ```javascript
    dbConfig: {
        dbName: 'testDB',
        dbVersion: 1,
        storeDefinitions: {

            // TrackingNumberRegistry form
            trackingNumberRegistry: {
                createOptions: { keyPath: 'entryId'},
                indexes: {
                    entryId:           { keyPath: 'entryId', unique: true, _id: 1 },
                    trackingNumber:    { keyPath: 'trackingNumber', _id: 1234560126 },
                    carrier:           { keyPath: 'carrier', _id: 8 },
                    status:            { keyPath: 'status', _id: 7 }
                },
                _sync: {}, // see _sync object details below
                _bulkSync: {}, // see _bulkSync object details below
        }
    }
    ```

    The above definition defines a dataStore table named `trackingNumberRegistry`. NOTE the `_id` attribute added to index definitions. According to WC3 spec, indexedDB instances cannot index
    fields that are simply an integer. Even an integer encoded as a string. [Unbelievable limitation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology#key), in any case, by default we store field names as their numeric ARS FieldID (that is `7` not `Status`). Fields that we want to be searchable by index, we add the `_id` attribute specifying the numeric fieldID containing data for the named index.

    NOTE ALSO: `createOptions` must *always* define `entryId` as the default index, for dataStores
    that have a `_sync` option

    * **`_sync` object**

    dataStores that have a corresponding ARS Form from / to which to sync data will define a `_sync` object of the form:

    ```javascript
    {
        enableSync: true,
        syncOrder: 1,
        bulkPutLimit: 1800,
        syncInterval:  (60 * 2 * 1000), // 2 minutes (ms)
        pruneInterval: (60 * 60 * 2 ), // 2 hours (sec),
        query: {
            schema: 'trackingNumberRegistry',
            fields: [ 'trackingNumber', 'carrier', 'status', 'Assigned To' ],
            QBE: `'Status' != "archive"`
        },
        rowUpdateCallback: (threadHandle, data) => { ... },
        writeQueueRowIsPrunable: async (formMeta, writeQueueRow, api, threadHandle) => { ... },
        writeTransactionTransform: (formMeta, trans, threadHandle) => { ... },
        postWriteSyncTransform: async (formMeta, trans, api, threadHandle) => { ... },
        formDefinitionTransform: (formDefinition) => { ... }

    }
    ```

    * **`enableSync` bool (default true)**

      if set `false` sync is disabled for this form

    * **`syncOrder` integer**

      inside the mainLoop, the `syncForms()` function will perform sync operations on each form in this sort order (so for instance if you need to transmit supporting data first, that kinda thing, this is how you do it)

    * **`bulkPutLimit` integer**

      large groups of rows will potentially need to be written to the dataStore. For what I can only describe as
      "reasons" performance writing individual rows to indexedDB is *abysmal* but you can end around it by writing
      multiple rows within a single transaction. This is somewhat of a delicate balance that requires tuning. An attempt to write *too many* rows at once, will yield horrible performance as well. In scenarios where
      we have more than this many rows to write to the dataStore, we will segment them into chunks of this many
      rows and write them using `noiceIndexedDB.bulkPut()`

    * **`syncInterval` integer (milliseconds)**

      execute `syncForm()` for this form/dataStore pair every `syncInterval` milliseonds. See also `mainLoopInterval` attribute above. The short story: at every `mainLoopInterval`, check the elapsed milliseconds since last `syncForm()` for this form, and if the delta is greater than `syncInterval`, execute `syncForm()`.

    * **`pruneInterval` integer (seconds)**

      prune form every this many seconds (not miliseconds, it's a long story, buckle up)

      Ok! So we have a dataStore and we have a Form on the AR Server, right? And every `syncInterval` ms, we send any queued writes, then pull all of the records from the server with a modified since the max modify date we have in the dataStore. Sync'd form, done and done, right? Well ... except things occasionally get *deleted* from the server. Finding out what you've got that no longer exists on the server and then dumping it from the dataStore is a lil thing I've decided to call "pruning" so when you see me throwing that word around, that's what I'm referring to.

      Depending on how many rows you have in a dataStore, this can be an *expensive* operation in terms of network, because less some minor optimizations (like excluding ones you just wrote in the sync, etc), you're gonna have to query the server to make sure every single one of these still exists (see notes on `queryListByteLimit` for more deets on that). In any case, it's expensive. On big forms it could take a while, you don't want to prune *every* time you sync. That would be super impractical.

    * **`query` object (`noiceRemedyAPI.query()`)**     

      the arguments to the `noiceRemedyAPI.query()` function to retrieve rows from the server so as to put them into the dataStore. NOTE on the `deltaSync()` function `query.QBE` is reformatted thusly `(${query.QBE}) AND (6 > ${maxModifiedDate})` where `maxModifiedDate` is the largest value of field ID `6` in the dataStore.

    * **`rowUpdateCallback` function(threadHandle, data)**

      in the case where we have received an update to an existing row from the server (most often as a result of transmitting a change to it), we may have the need of notifying the UI thread (i.e. the "the onscreen row has been updated" signal. You may need to do any number of things when this happens (for instance calling a `noiceWorkerThread.signalParent()` or perhaps you have something more elaborate in mind). In any case, if you define this function, it will be executed in such instances. `threadHandle` is a reference to `this` in the `noiceARSSyncWorkerThread` object, and `data` is an array of objects representing rows that have been updated, of this form:

      ```javascript
      [
          {
              formName: `<str>`,
              entryId: `<str>`,
              old_entryId: `<str>`
          },
          ...
      ]
      ```

      * **`formName` string**
      the name of the form (ARS Form Name) on the server in which the identified row exists

      * **`entryId` string**
      the *current* entryId of the record on the server

      * **`old_entryId` string**
      the *previous* entryId of the record in the dataStore. In the case of create transactions, the row will be given a locally generated GUID for a value of `entryId`. When the create transaction is executed, we fetch the new row with returned entryId from the server and write it to the dataStore, then delete the temporary row with `old_entryId`. This is included here for the UI thread (if there is an onscreen row just submitted) to swap the entryId identifier

  * **`writeQueueRowIsPrunable` async function(formMeta, writeQueueRow, api, threadHandle)**

    So to explain this, I need to explain the `writeQueue`. You need to create a row on a form, or perhaps modify one. What you do in that situation
    is two things. First, you go ahead and write your changes into the corresponding row on the dataStore. The second thing you do is you write a row to the `writeQueue` table. This dataStore is not defined in the config but is hard coded into the `noiceARSSyncWorkerThread` constructor. There's a lot of detail here (see `writeQueue` detail section below), but suffice it to say the writeQueue is coalesced into the minumum set of api transactions necessary, then those transactions are executed, marking these rows with `status:'transmitted'`. You dont necessarily want to delete these right away once they're transmitted, because the presense of this record in the indexedDB is the only way we have of showing the user a "hey we sent your change" notice (otherwise it's just the blind current state). Add to that you may have like a "wait for confirmation processed serverside before delete" type data redunancy thing you wanna do just to be sure nobody's work ever gets lost.

    but at some point we do have to delete them. This function is an extensible way of implementing that logic. This function will be called for each `writeQueue` row with `status:transmitted`, along with that row (`writeQueueRow`) you also get `formMeta` (which contains the form definition) `api` (the api handle), and `threadHandle` (this on the noiceARSSyncWorkerThread object). Ye verily tis asynchronous so one could look some thangs up if one needed to. Return boolean `true` to delete the row and `false` not to.  

  * **`writeTransactionTransform` function(formMeta, trans, threadHandle)**

    OK. Let's say you're in the very common situation where you have a "form of record" in the AR Server that for various reasons you do not want to write creates/updates to *directly*, rather you want to bounce those transactions through a "landing" form where workflow will do some shenanigans and create or update the record on the actual form for you. How do you handle that? Well, I'm glad you asked.

    the `writeTransactionTransform` function, should you define it, will as the name implies allow you to *transform* a write transaction before it is executed. You return the modified `trans` object. What you return is what's gonna get executed. It takes three arguments

    * **`formMeta` object**
    an object containing among other things the formDefinition, storeName, schemaName, etc), `trans` (lol)

    * **`trans` object**
    this object represents the transaction queued for execution which you presumably wish to modify in some way. This will be an object of the form:

    ```javascript
    {
        storeName: formMeta.storeName,
        entryId: entryId,
        writeQueueRows: [],
        call: 'modifyTicket',
        args: {
            schema: formMeta.formName,
            ticket: entryId,
            fields: {}
        }
    }
    ```

    * **`storeName` string**
    the name of the dataStore the row being created or updated exists on

    * **`entryId` string**
    the value of `entryId` on the row in `storeName` that the create or modify transaction is for

    * **`writeQueueRows` array**
    there will be one or more rows in the `writeQueue` which will correspond to this single transaction. When that transaction completes, we'll need to mark them `status:'transmitted'` and so that's why they're here (so we can modify them and push them back without needing to query them again). Might be useful, I dunno. But there they are.

    * **`call` string**
    name of the function on the `noiceRemedyAPI` object to call with the `args` object. NOTE: there is a whitelist hardcoded in the `noiceARSSyncWorkerThread` class. You'll need to override it if you want something other than `createTicket` or `modifyTicket`.

    * **`args` object**
    arguments to send to the api function identified by `call`. You might wanna modify these even.

  * **`postWriteSyncTransform` async function(formMeta, trans, api, threadHandle)**

    when we have executed a write transaction, we are then going to execute a `noiceRemedyAPI.getTicket()` on the row we just modified or perhaps the row we just created. In the way that `writeTransactionTransform` allows you to intercept and transform the write api transaction, this allows you to intercept and transform the read transaction. For instance if you wrote to a landing form you might need to query the entryId you created on the landing form for the entryId of the *actual* record on the main form. This is async so you can do that. Only real difference is you get an api handle, and `trans` is just the args to `getTicket()`

  * **`formDefinitionTransform` function(formDefinition)**

    if defined, this function is executed on formDefinition fetch from server, between `api.getFormFields()` and `noiceIndexedDB.put()`, whatever you return from this function will be written as the formDefintion for this form. The need for this function should be fairly rare. This is handy, in the case of a viewForm on the server for `CURRENCY` fields where the view MUST model them as a `DECIMAL` and you need to manually override the datatype in-app. Use with caution but
    if you need these shenanigans, this is the proper way to implement them

* **`_bulkSync` object**

    You might be saying to yourself "that's all well and good, but I've got a form with literally 2 million rows". This is for exactly that. In that situation one can create a file containing *all* of the rows matching the sync query on the form. Maybe you use something like Atrium Integrator to automatically dump said form to said file every few hours and upload it as an attachment or a CLOB field on a form. Then you could have your client periodically fetch this whole-table snapshot, then a subsequent delta from the file's build date, then prune any rows not existing in the union of the bulk + delta entryId index, and -- you have a *very* quick sync of boatloads of data by comparison to using the `_sync` algorithm.

    the `_bulkSync` object is of this basic form:

    ```javascript
        _bulkSync: {
            disableSlowPrune: true,
            metaQuery: { <noiceRemedyAPI.query()> },

            // config-define way of getting the bulk file build date
            getDataFileBuildDate: (metaQueryResult, threadHandle) => { ... },

            // return the arguments to api.query() to retrieve the datafile
            dataFileQueryCallback: (metaQueryResult, formMeta, threadHandle) => { ... },

            // callback resolves boolean true if the server contains a version of the file > the currently installed one
            hasNewDataCallback: (metaQueryResult, formMeta, threadHandle) => { ... },

            /*
                this takes the dataFile and parses it, returning an object containing an
                array of indexedDB datastore row-formatted records
                this should return a promise resolving to { maxModifiedDate: <int>, writeQueue: <array> }
            */
            parseDataFile: (dataFileQueryResult, formMeta, threadHandle) => { ... }

        }
    ```

    * **`disableSlowPrune` bool (default: `false`)**

      the `pruneForm()` function has two modes: `slowPune` and `quickPrune`. The `quickPrune` algorithm is described above (we install the data file, then fetch the delta from the server based on the file build date, then prune every entryId not in the union of entryIds from the delta and bulk sync). The `slowPrune` algorithm queries for the existence of each row on the server and is *expensive* as described above. Noteably, `quickPrune` is only available if `_bulkSync` is configured *and* there is a sync where the `pruneInterval` has been met *and* we've got a new file on the server inside the same `syncInterval`, in all other cases it will default back to `slowPrune` (note: use `pruneInterval` judiciously). In some cases (for instance the aforementioned bajillion row form), you definitely *do not* want to execute `slowPrune` *ever*. It's literally at the point where no prune is better if theres not a new data file. If you are in that situation set `disableSlowPrune: true`

    * **`metaQuery` object, noiceRemedyAPI.query()**

      this query retrieves *meta data* about the dataFile on the server. Among those things, it's size and it's build date.

    * **`getDataFileBuildDate` function(metaQueryResult, threadHandle)**

       this takes the results of metaQuery, and selects the build date of the file ('Modified Date' in most cases but
       this function allows for more elaborate arrangements should you need them), then returns that as epoch dateTime

    * **`hasNewDataCallback` function(metaQueryResult, formMeta, threadHandle)**

      this takes the result of metaQuery, and the formMeta object (which contains the date of the last installed datafile), and allows you to do whatever custom logic you to compare the output of getDataFileBuildDate() with the formMeta in an extensible way. Basicallty return `true` if there's a new file to fetch, else `false`

    * **`dataFileQueryCallback` function(metaQueryResult, formMeta, threadHandle)**

    this callback function executes a query that fetches the datafile.

    * **`parseDataFile` function(dataFileQueryResult, formMeta, threadHandle)**

      this callback function accepts the output of dataFileQueryCallback and returns an array of rows formatted for dataStore insertion

## Usage

LOH 9/8/23 @ 1220
I mean yeah I need to write it all down but ... will come back to it
