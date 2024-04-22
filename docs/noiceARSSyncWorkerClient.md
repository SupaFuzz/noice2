# noiceARSSyncWorkerClient
a library for interfacing with a noiceARSSyncWorkerThread from a parent thread


## constructor({})
```javascript
/*
    constructor({
        _app: <noiceApplicationCore>,
        threadName: <nameOfARSSyncWorkerThreadIn_app>,
        threadInfo:   <noiceARSSyncWorkerThread.getThreadInfo() output>
        messageHandler: <function(data)>
    })
*/
```



## getARSRow({})
```javascript
/*
    getARSRow({
        schema: <str>,
        ticket: <str>,
        fields: [<str>,<str>,...],
        returnFormat: <enum: raw|fieldName|fieldID> (default fieldName),
        dateFormat: <enum: any date time format accepted by noiceCore.fromEpoch> default: datetime-local
        returnChanges: <bool> (default: false)
    })

    this emulates noiceRemedyAPI.getTicket() args
    for now, pulls data out of the appropriate indexedDB instance
    in the future this might multiplex an optional server-query-first
    more traditional cache mechanism

    returned data format is controlled by returnFormat:
        * raw -> gives you exactly what's in the dataStore
        * fieldName -> converts all fields to ARS fieldName (if present in config, else raw row column name)
        * fieldID -> converts everything to numeric fieldID (again if present in config, else raw)

    if returnChanges is set true, we also return the content of the writeQueue for this schema and record:
    _changes: [ arrayOfWriteQueueEntries ]
*/
```




## getAllARSRows({})
```javascript
/*
    getAllARSRows({
        schema: <str>,
        fields: [<str>, <str>, ...],
        indexName: <str (optional)>,
        query: <IDBKeyRange (optional)>,
        count: <int (optional)>,
        returnFormat: <enum: raw|fieldName|fieldID> (default fieldName),
        dateFormat: <enum: any date time format accepted by noiceCore.fromEpoch> default: datetime-local
        returnChanges: <bool> (default: false)
    })

    this is sort of like a query? it allows you to do the equivalent of noiceIndexedDB.getAll() but
    against a schema with otherwise the same options as getARSRow(). So like ... real simple queries
    perhaps against complex indexes. See also the openCursor for more extensible options
*/
```




## modifyARSRow({})
```javascript
/*
    modifyARSRow({
        schema: <str>,
        ticket: <str>,
        fields: { <fieldName>:<value>, ... }
    })

    emulates noiceRemedyAPI.modifyTicket() args
    what it says on the tin. Modifies a row in the local indexedDB instance where the
    dataStore corresponding to the specified schema resides. This handles updating both
    the in-table row as well as adding the appropriate transaction to the arsSyncWorker's
    writeQueue

    note fields can be fieldName or fieldID spefified columns
*/
```




## createARSRow({})
```javascript
/*
    createARSRow({
        schema: <str>,
        fields: { <fieldName>:<value>, ...}
    })
*/
```




## getThreadInfo()
```javascript
/*
    getThreadInfo()
    fetch threadInfo from the given threadHandle

    this info contains form -> dbInstance.dataStore mappings and
    form definitions among other things
*/
```




## hasThreadInfo - attrbute(bool)
attribute is true if threadInfo has been fetched from the noiceARSSyncWorkerThread



## mountAll()
mounts all the indexedDB databases managed by the noiceARSSyncWorkerThread
this resolves to self so it can be chained with the constructor




## filterRequestedFields(schema, fields, dbRow)
return the dbRow but delete every column that is not equivalent to a value in the specified array of fieldNames (fields) on schema failures return an empty object




## convertDBRowToFieldNames(schema, dbRow)
convert all columns on the dbRow to equivalent fieldName values from the given schema if no match on formDef, just return the db-native column names




## convertDBRowToFieldIDs(schema, dbRow)
convert all columns on the dbRow to equivalent fieldID values from the given schema if no match on formDef, just return the db-native column names




## convertFieldNamesToDBRow(schema, data)
converts a row in fieldName format to dbRow format (indexed fields get indexName, else fieldID)
NOTE: if you pass in extra fields that don't exist in the formDefinition, this will simply pass them through to the output unchanged




## getDBInfo()
return noiceIndexedDN.getDescription() for all the DBs managed by the noiceARSSyncWorkerThread




## getDBInstance(schemaName)
given an ARS schema name, return the indexedDB instance containing the corresponding dataStore




## listSchemas()
return an array of distinct ARS SchemaNames managed by the noiceARSSyncWorkerThread




## openCursor({})
```javascript
/*
    openCursor({
        schema: <str>,
        indexName: <string (optional)>,
        query:     <IDBKeyRange (optional)>,
        direction: <next|nextunique|prev|prevunique> default:next
        callback: <function(cursor, client, schemaName)>
    });

    there's just no good way to implement a QBE or other freeform search with this
    best I can give you is an enhanced openCursor that knows about schemas and fields
    and indexes and stuff. Also you could use getDBInstance() above to do specific
    index searches via getAll() and the like.

    so this is a re-implementation of noiceIndexedDB.openCursor
    the main difference being no 'storeName' arg, instead we take the schemaName,
    the other big difference is that we pass *three* arguments to the callback,
    cursor, and a self ref, and the schemaName
*/
```
