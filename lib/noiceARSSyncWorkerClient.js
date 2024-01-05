/*
    this is a client for noiceARSSyncWorkerThread
    12/22/23 - start work
*/

import { noiceCoreUtility, noiceException, noiceObjectCore } from './noiceCore.js';
import { noiceIndexedDB } from './noiceIndexedDB.js';

class noiceARSSyncWorkerClient extends noiceCoreUtility {




/*
    constructor({
        _app: <noiceApplicationCore>,
        threadName: <nameOfARSSyncWorkerThreadIn_app>,
        threadInfo:   <noiceARSSyncWorkerThread.getThreadInfo() output>
        messageHandler: <function(data)>
    })
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version: 1,
        _className: 'noiceARSSyncWorkerClient',
        _app: null,
        _hasThreadInfo: false,
        debug: false,
        threadName: null,
        threadInfo:   {},
        messageHandler: null,
        DBs: {}
    },defaults),callback);
}




/*
    getThreadInfo()
    fetch threadInfo from the given threadHandle
*/
getThreadInfo(){
    let that = this;
    return(new Promise((toot, boot) =>{
        if (that.isNull(that._app)){
            boot('_app is not specified for thread communication');
        }else if (that.isNull(that.threadName)){
            boot('threadName is not specified');
        }else if (!(that._app._threadHandles.hasOwnProperty(that.threadName))){
            boot('_app does not have a threadHandle for the specified threadName');
        }else{
            that._app.threadResponse({
                threadName: that.threadName,
                postMessage: { type: 'threadInfo' },
                awaitResponseType: 'threadInfo'
            }).then((r) => {
                if ((r instanceof Object) && (r.data instanceof Object) && (r.data.threadInfo instanceof Object) && (Object.keys(r.data.threadInfo) > 0)){
                    that.threadInfo = r.data.threadInfo;
                    toot(r.data.threadInfo);
                }else{
                    let error = ((r instanceof Object) && (r.data instanceof Object) && r.data.hasOwnProperty('errorMessage'))?r.data.errorMessage:'unknown';
                    that._app.log(`${that._className} v${that._version} | getThreadInfo() | threadInfo threadResponse contains error: ${error}`);
                    boot(error);
                }
            }).catch((error) => {
                that._app.log(`${that._className} v${that._version} | getThreadInfo() | threadInfo threadResponse call threw unexpectedly: ${error}`);
                boot(error);
            });
        }

    }));
}
get hasThreadInfo(){ return( Object.keys(this.threadInfo).length > 0 ); }
set hasThreadInfo(v){ this._hasThreadInfo = (v === true); }




/*
    mountDB(dbTagName)
    mount the specified indexedDB instance. We don't give a hoot about
    upgrades and versions n stuff here ... the noiceARSSyncWorkerThread
    must be initted before we can spawn the client, and it'll handle
    the housekeeping :-)
*/
mountDB(dbTagName){
    let that = this;
    return(new Promise((toot, boot) => {
        if (that.hasThreadInfo && (that.threadInfo.DBs instanceof Object) && (that.threadInfo.internalDBConfig instanceof Object)){

            let dbConfig = (dbTagName == 'internalDB')?that.threadInfo.internalDBConfig:(that.threadInfo.DBs.hasOwnProperty(dbTagName))?that.threadInfo.DBs[dbTagName]:null;
            if (that.isNotNull(dbConfig)){
                new noiceIndexedDB(dbConfig).open({destructiveSetup: false}).then((db) => {
                    that.DBs[dbTagName] = db;
                    toot(db);
                }).catch((error) => {
                    that._app.log(`${that._className} v${that._version} | mountDB(${dbTagName}) | indexedDB.mount() threw unexpectedly ${error}`);
                    boot(error);
                });
            }else{
                let error = 'threadInfo does not contain definition for specified dbTagName';
                that._app.log(`${that._className} v${that._version} | mountDB(${dbTagName}) | ${error}`);
                boot(error);
            }
        }else{
            let error = 'threadInfo not loaded, exit with error';
            that._app.log(`${that._className} v${that._version} | mountDB(${dbTagName}) | ${error}`);
            boot(error);
        }

    }));
}




/*
    mountAll()
    mount all the databases specified in threadInfo
    resolves to self so can be chained with constructor
*/
mountAll(){
    let that = this;
    let fn = 'mountAll';
    return(new Promise((toot, boot) => {
        if (that.hasThreadInfo && (that.threadInfo.DBs instanceof Object)){

            let mountQueue = Object.keys(that.threadInfo.DBs).concat(['internalDB']);

            // side note: it is a tragedy that there's not a Promise.each or something ugh. tired of writing these iterators
            function mountHelper(idx){
                if (idx == mountQueue.length){
                    if (that.messageHandler instanceof Function){ that.messageHandler({
                        error: false,
                        message: 'all databases mounted',
                        detail: ``,
                        runAnimation: false,
                        functionName: fn
                    }); }
                    toot(that);
                }else{
                    that.mountDB(mountQueue[idx]).then((d) => {
                        mountHelper((idx + 1));
                    }).catch((error) => {
                        that._app.log(`${that._className} v${that._version} | mount() | failed to mount database ${mountQueue[idx]} | ${error}`);
                        if (that.messageHandler instanceof Function){ that.messageHandler({
                            messageNumber: 21,
                            error: true,
                            message: `failed to mount database ${mountQueue[idx]} (please contact administrator)`,
                            detail: `${error}`,
                            runAnimation: false,
                            functionName: fn
                        }); }
                        boot(error);
                    });
                }
            }

            // do ieet (or don't if we don't have any)
            if (mountQueue.length > 0){
                mountHelper(0);
            }else{
                let error = 'there do not appear to be any databses defined in the config. exit with error';
                that._app.log(`${that._className} v${that._version} | mount() | ${error}`);
                if (that.messageHandler instanceof Function){ that.messageHandler({
                    messageNumber: 22,
                    error: true,
                    message: `failed to mount databases (please contact administrator)`,
                    detail: `${error}`,
                    runAnimation: false,
                    functionName: fn
                }); }
                boot(error);
            }

        }else{
            let error = 'cannot find DBs in threadInfo?'
            that._app.log(`${that._className} v${that._version} | mount() | ${error}`);
            if (that.messageHandler instanceof Function){ that.messageHandler({
                messageNumber: 20,
                error: true,
                message: 'failed to mount databases (please contact administrator)',
                detail: `${error}`,
                runAnimation: false,
            }); }
            boot(error);
        }
    }));
}




/*
    getDBInfo()
    return getDescription for all the DBs we've got
*/
getDBInfo(){
    let that = this;
    return(new Promise((toot, boot) => {
        let out = {};
        Promise.all(Object.keys(that.DBs).map((dbName) => {return(new Promise((_t,_b) => {
            that.DBs[dbName].getDescription().then((desc) => {
                out[dbName] = desc;
                _t(true);
            }).catch((error) => {
                that._app.log(`${that._className} v${that._version} | getDBInfo() | indexedDB.getDescription(${dbName}) threw unexpectedly: ${error}`);
                boot(error);
            });
        }))})).then(() => {
            toot(out);
        }).catch((error) => {
            that._app.log(`${that._className} v${that._version} | getDBInfo() | at least one DB failed getDescription() (see log): ${error}`);
            boot(error);
        })
    }));
}




/*
    getARSRow({
        schema: <str>,
        ticket: <str>,
        fields: [<str>,<str>,...],
        returnFormat: <enum: raw|fieldName|fieldID> (default fieldName),
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
getARSRow(args){
    let that = this;
    return(new Promise((toot, boot) => {

        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            (that.threadInfo instanceof Object) &&
            (that.threadInfo.formDBMappings instanceof Object) &&
            that.threadInfo.formDBMappings.hasOwnProperty(args.schema) &&
            args.hasOwnProperty('ticket') &&
            that.isNotNull(args.ticket)
        ){

            that.DBs[that.threadInfo.formDBMappings[args.schema].dbTagName].get({
                storeName: that.threadInfo.formDBMappings[args.schema].storeName,
                indexName: 'entryId',
                key: args.ticket
            }).then((row) => {
                let out = {};
                // fetch the writeQueue if we're supposed to
                new Promise((_t,_b) => {
                    if (args.hasOwnProperty('returnChanges') && (args.returnChanges === true)){
                        that.DBs.internalDB.getAll({
                            storeName: 'writeQueue',
                            indexName: 'schemaEntryId',
                            query: IDBKeyRange.only([args.schema, args.ticket])
                        }).then((rows) =>{
                            out._changes = rows;
                            _t(true);
                        }).catch((error) => {
                            // note should not happen as no-match is just an empty array so this real-deal bad time stuff here
                            _b(error);
                        });
                    }else{
                        _t(true);
                    }
                }).then(() => {

                    let fields = (args.fields instanceof Array)?args.fields:[];
                    let mode = args.hasOwnProperty('returnFormat')?args.returnFormat:'fieldName';
                    switch (mode){
                        case 'raw':
                            toot(Object.assign(out, that.filterRequestedFields(args.schema, fields, row)));
                            break;
                        case 'fieldName':
                            toot(Object.assign(out, that.convertDBRowToFieldNames(args.schema, that.filterRequestedFields(args.schema, fields, row))));
                            break;
                        case 'fieldID':
                            toot(Object.assign(out, that.convertDBRowToFieldIDs(args.schema, that.filterRequestedFields(args.schema, fields, row))));
                        default:
                            if (that.debug){that._app.log(`${that._className} v${that._version} | getARSRow(${JSON.stringify(args)}) | invalid 'returnFormat' specified`);}
                            boot(`invalid 'returnFormat' specified`);
                    }
                }).catch((error) => {
                    that._app.log(`${that._className} v${that._version} | getARSRow(${JSON.stringify(args)}) | indexedDB.getAll() threw unexpectedly fetching requested writeQueue: ${error}`);
                    boot(error);
                });
            }).catch((error) => {
                if (that.debug){that._app.log(`${that._className} v${that._version} | getARSRow(${JSON.stringify(args)}) | query failed: ${error}`);}
                boot(error);
            });

        }else{
            if (that.debug){that._app.log(`${that._className} v${that._version} | getARSRow(${JSON.stringify(args)}) | invalid input args`);}
            boot('invalid input args');
        }
    }));
}




/*
    filterRequestedFields(schema, fields, dbRow)
    return the dbRow but delete every column that is not equivalent to
    a value in the specified array of fieldNames (fields) on schema
    failures return an empty object
*/
filterRequestedFields(schema, fields, dbRow){
    let that = this;
    if (
        (that.isNotNull(schema)) &&
        (dbRow instanceof Object) &&
        (that.threadInfo.formDefinitions instanceof Object) &&
        (that.threadInfo.formDefinitions[schema] instanceof Object) &&
        (that.threadInfo.formDefinitions[schema].nameIndex instanceof Object) &&
        (fields instanceof Array) &&
        (fields.length > 0) &&
        (fields.filter((a)=>{return(that.threadInfo.formDefinitions[schema].nameIndex.hasOwnProperty(a))}).length == fields.length) &&
        (that.threadInfo.formIndexMappings instanceof Object) &&
        (that.threadInfo.formIndexMappings[schema] instanceof Object)
    ){

        /*
            1/5/24 @ 0956 -- just a note
            indexOf does not work against integer values in arrays. no shit
            that's why all the explicit string conversions below
            who woulda thought?!!
        */

        // translate fields (fieldNames) into an equivalent list of dbRow format columnNames
        let match = fields.map((fieldName) => {return(
            that.threadInfo.formIndexMappings[schema].hasOwnProperty(that.threadInfo.formDefinitions[schema].nameIndex[fieldName].id)?`${that.threadInfo.formIndexMappings[schema][that.threadInfo.formDefinitions[schema].nameIndex[fieldName].id]}`:`${that.threadInfo.formDefinitions[schema].nameIndex[fieldName].id}`
        )});

        // we filterin'!
        let out = {};
        Object.keys(dbRow).filter((colName) => {return(match.indexOf(`${colName}`) >= 0)}).forEach((colName) => {out[colName] = dbRow[colName]; });
        return(out);

    }else{
        that._app.log(`${that._className} v${that._version} | filterRequestedFields(${schema}) | invalid input`)
        return(dbRow);
    }
}




/*
    convertDBRowToFieldNames(schema, dbRow)
    convert all columns on the dbRow to equivalent fieldName values from the given schema
    if no match on formDef, just return the db-native column names
*/
convertDBRowToFieldNames(schema, dbRow){
    let that = this;
    if (
        (that.isNotNull(schema)) &&
        (dbRow instanceof Object) &&
        (that.threadInfo.formDefinitions instanceof Object) &&
        (that.threadInfo.formDefinitions[schema] instanceof Object) &&
        (that.threadInfo.formDefinitions[schema].idIndex instanceof Object) &&
        (that.threadInfo.formIDToIndexMappings instanceof Object) &&
        (that.threadInfo.formIDToIndexMappings[schema] instanceof Object)
    ){
        let out = {};
        Object.keys(dbRow).forEach((colName) => {
            let fid = that.threadInfo.formIDToIndexMappings[schema].hasOwnProperty(colName)?that.threadInfo.formIDToIndexMappings[schema][colName]:colName;
            let colRename = that.threadInfo.formDefinitions[schema].idIndex.hasOwnProperty(fid)?that.threadInfo.formDefinitions[schema].idIndex[fid].name:fid;
            out[colRename] = dbRow[colName];
        })
        return(out);
    }else{
        that._app.log(`${that._className} v${that._version} | convertDBRowToFieldNames(${schema}) | invalid input`)
        return({});
    }
}




/*
    convertDBRowToFieldIDs(schema, dbRow)
    convert all columns on the dbRow to equivalent fieldID values from the given schema
    if no match on formDef, just return the db-native column names
*/
convertDBRowToFieldIDs(schema, dbRow){
    let that = this;
    if (
        (that.isNotNull(schema)) &&
        (dbRow instanceof Object) &&
        (that.threadInfo.formIDToIndexMappings instanceof Object) &&
        (that.threadInfo.formIDToIndexMappings[schema] instanceof Object)
    ){
        let out = {};
        Object.keys(dbRow).forEach((colName) => {
            out[that.threadInfo.formIDToIndexMappings[schema].hasOwnProperty(colName)?that.threadInfo.formIDToIndexMappings[schema][colName]:colName] = dbRow[colName];
        });
        return(out);
    }else{
        that._app.log(`${that._className} v${that._version} | convertDBRowToFieldIDs(${schema}) | invalid input`)
        return({});
    }
}




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
modifyARSRow(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            (that.threadInfo instanceof Object) &&
            (that.threadInfo.formDBMappings instanceof Object) &&
            that.threadInfo.formDBMappings.hasOwnProperty(args.schema) &&
            args.hasOwnProperty('ticket') &&
            that.isNotNull(args.ticket) &&
            (args.fields instanceof Object) &&
            (Object.keys(args.fields).length > 0)
        ){

            // step one: fetch the existing row
            that.DBs[that.threadInfo.formDBMappings[args.schema].dbTagName].get({
                storeName: that.threadInfo.formDBMappings[args.schema].storeName,
                indexName: 'entryId',
                key: args.ticket
            }).then((row) => {

                /*
                    NOTE: we might want a mechanism like filters here
                    which is to say, externally defined code chunks that
                    fire on modify or rows on a specific form that are
                    capable of changing values on the way into the database
                    or throwing errors and aborting the write.

                    that's a big chunk of complication. Think it's a great idea
                    but later. not today -Amy 1/5/23 @ 1414
                */

                // step two: convert given fields to row (raw) format
                let dbRow = null;
                try {
                    dbRow = that.convertFieldNamesToDBRow(args.schema, args.fields);
                }catch(error){
                    // error - failed to convert fields to dbRow format
                    that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | convertFieldNamesToDBRow() threw unexpectedly: ${error}`);
                }
                if (that.isNotNull(dbRow)){

                    // step three: convert given fields to writeQueue entry
                    let wqFields = that.convertDBRowToFieldIDs(args.schema, dbRow);
                    if ((wqFields instanceof Object) && (Object.keys(wqFields).length > 0)){

                        let modDateHiRes = that.epochTimestamp(true);

                        // step four: write the writeQueue entry
                        that.DBs.internalDB.put({
                            storeName: 'writeQueue',
                            object: {
                                entryId: args.ticket,
                                schema:  args.schema,
                                transactionType: 'modify',
                                transactionDate: modDateHiRes,
                                status: 'queued',
                                fields: wqFields
                            }
                        }).then(() => {

                            // update modified date field
                            dbRow[that.threadInfo.formIndexMappings.hasOwnProperty('6')?that.threadInfo.formIndexMappings['6']:6] = Math.floor(modDateHiRes/1000);

                            // step five: write changes to target dataStore
                            that.DBs[that.threadInfo.formDBMappings[args.schema].dbTagName].put({
                                storeName: that.threadInfo.formDBMappings[args.schema].storeName,
                                object: Object.assign(row, dbRow)
                            }).then(() => {

                                // all good we out
                                if (that.debug){ that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | success!`); }
                                toot(true);

                            }).catch((error) => {
                                that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | failed to update targetForm entry: ${error}`);
                                boot('failed to modify targetForm entry');
                            });
                        }).catch((error) => {
                            that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | failed to create writeQueue entry: ${error}`);
                            boot('failed to create writeQueue entry');
                        });
                    }else{
                        that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | convertDBRowToFieldIDs() threw unexpectedly: ${error}`);
                        boot('failed to convert fields to writeQueue entry');
                    }
                }else{
                    boot(`failed to convert fieldNames to dbRow format`);
                }
            }).catch((error) => {
                // error - failed to fetch requested row
                if (that.debug){that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | failed to fetch row to modify from db: ${error}`);}
                boot(error);
            });
        }else{
            // error - invalid input
            that._app.log(`${that._className} v${that._version} | modifyARSRow(${JSON.stringify(args)}) | invalid input`)
            boot('invalid input');
        }
    }));
}




/*
    convertFieldNamesToDBRow(schema, data)

    NOTE: if you pass in extra fields that don't exist in the formDefinition,
    this will simply pass them through to the output unchanged.
*/
convertFieldNamesToDBRow(schema, data){
    let that = this;
    if (
        (that.isNotNull(schema)) &&
        (data instanceof Object) &&
        (Object.keys(data).length > 0) &&
        (that.threadInfo.formDefinitions instanceof Object) &&
        (that.threadInfo.formDefinitions[schema] instanceof Object) &&
        (that.threadInfo.formDefinitions[schema].nameIndex instanceof Object) &&
        (that.threadInfo.formIndexMappings instanceof Object) &&
        (that.threadInfo.formIndexMappings[schema] instanceof Object) &&
        (that.threadInfo.formIDToIndexMappings instanceof Object) &&
        (that.threadInfo.formIDToIndexMappings[schema] instanceof Object)
    ){

        let out = {};
        Object.keys(data).forEach((fieldName) => {

            // if it's a fully numeric columnName ...
            if (/^\d+$/.test(fieldName)){
                out[that.threadInfo.formIndexMappings[schema].hasOwnProperty(fieldName)?that.threadInfo.formIndexMappings[schema][fieldName]:fieldName] = data[fieldName];

            // else if the formDefinition has a field named this ...
            }else if (that.threadInfo.formDefinitions[schema].nameIndex.hasOwnProperty(fieldName)){
                let id = that.threadInfo.formDefinitions[schema].nameIndex[fieldName].id;
                out[that.threadInfo.formIndexMappings[schema].hasOwnProperty(id)?that.threadInfo.formIndexMappings[schema][id]:id] = data[fieldName];

            // else if it's just a random field y'know?
            }else{
                out[that.threadInfo.formIDToIndexMappings[schema].hasOwnProperty(fieldName)?that.threadInfo.formIDToIndexMappings[schema][fieldName]:fieldName] = data[fieldName];
            }
        });
        return(out);
    }else{
        // error - invalid input. I hate it but this needs a throw
        that._app.log(`${that._className} v${that._version} | convertFieldNamesToDBRow(${schema}) | invalid input `)
        throw(`invalid input`);
    }
}




/*
    createARSRow({
        schema: <str>,
        fields: { <fieldName>:<value>, ...}
    })
*/
createARSRow(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            (that.threadInfo instanceof Object) &&
            (that.threadInfo.formDBMappings instanceof Object) &&
            that.threadInfo.formDBMappings.hasOwnProperty(args.schema) &&
            (args.fields instanceof Object) &&
            (Object.keys(args.fields).length > 0)
        ){

            // convert fields to dbRow format
            let dbRow = null;
            try {
                dbRow = that.convertFieldNamesToDBRow(args.schema, args.fields);
            }catch(error){
                // error - failed to convert fields to dbRow format
                that._app.log(`${that._className} v${that._version} | createARSRow(${JSON.stringify(args)}) | convertFieldNamesToDBRow() threw unexpectedly: ${error}`);
            }
            if (that.isNotNull(dbRow)){

                // setup createDate/ModifiedDate
                let modDateHiRes = that.epochTimestamp(true);
                ['3','6'].forEach((fid) => {
                    dbRow[that.threadInfo.formIndexMappings.hasOwnProperty(fid)?that.threadInfo.formIndexMappings[fid]:fid] = Math.floor(modDateHiRes/1000);
                });

                // make a writeQueue format row
                let wqFields = that.convertDBRowToFieldIDs(args.schema, dbRow);

                // give it a GUID for entryId if the caller didn't specify one
                if (! (dbRow.hasOwnProperty('entryId') && that.isNotNull(dbRow.entryId) )){ dbRow.entryId = that.getGUID(); }

                if ((wqFields instanceof Object) && (Object.keys(wqFields).length > 0)){

                    // put it in the writeQueue
                    that.DBs.internalDB.put({
                        storeName: 'writeQueue',
                        object: {
                            entryId: dbRow.entryId,
                            schema:  args.schema,
                            transactionType: 'create',
                            transactionDate: modDateHiRes,
                            status: 'queued',
                            fields: wqFields
                        }
                    }).then(() => {

                        // write the new row to the targetForm
                        that.DBs[that.threadInfo.formDBMappings[args.schema].dbTagName].put({
                            storeName: that.threadInfo.formDBMappings[args.schema].storeName,
                            object: dbRow
                        }).then(() => {

                            // all good we out
                            if (that.debug){ that._app.log(`${that._className} v${that._version} | createARSRow(${JSON.stringify(args)}) | success!`); }
                            toot(dbRow.entryId);

                        }).catch((error) => {
                            that._app.log(`${that._className} v${that._version} | createARSRow(${JSON.stringify(args)}) | failed to create targetForm entry: ${error}`);
                            boot('failed to create targetForm entry');
                        });

                    }).catch((error) => {
                        that._app.log(`${that._className} v${that._version} | createARSRow(${JSON.stringify(args)}) | failed to create writeQueue entry indexedDB.put(writeQueue) threw unexpectedly: ${error}`);
                        boot('failed to create writeQueue entry');
                    });
                }else{
                    // error - failed to convert to writeQueue format
                    that._app.log(`${that._className} v${that._version} | createARSRow(${JSON.stringify(args)}) | convertDBRowToFieldIDs() threw unexpectedly: ${error}`);
                    boot('failed to convert fields to writeQueue entry');
                }
            }else{
                // error - failed to convert fields to dbRow
                boot(`failed to convert fieldNames to dbRow format`);
            }
        }else{
            // error - invalid input
            that._app.log(`${that._className} v${that._version} | createARSRow(${JSON.stringify(args)}) | invalid input`)
            boot('invalid input');
        }
    }));
}




}
export { noiceARSSyncWorkerClient };
