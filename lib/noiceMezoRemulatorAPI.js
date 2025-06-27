/*
    noiceMezoRemulatorAPI.js
    extends noiceMezoAPI to include functions necessary for
    remulation on the mezo platform

    NOTE: 6/27/25 - this library lacks modifyTicket() emulation
    purely because it wasn't needed by noiceMezoRemulatorThread
    that should be fixed at some point
*/
'use strict';
import { noiceMezoAPI } from './noiceMezoAPI.js';
import { noiceException } from './noiceCore.js';

class noiceMezoRemulatorAPI extends noiceMezoAPI {




/*
    constructor({
        protocol:   http | https (default https)
        server:     <hostname>
        port:       <portNumber> (optionally specify a nonstandard port number)
    })
*/
constructor (args){
    super(args, {
        _version:   1,
        _className: 'noiceMezoRemulatorAPI',
        _formDefinitions: {},
        debug: false,
        protocol: 'https',
        proxyPath: null,
        token: null
    });
} // end constructor




/*
    getFormFields({
        schema:     <schemaName>,
        fetchMenus: <bool>
        progressCallback: <function(receivedBytes, totalBytes, completeBool)>,
        force:      <bool>
    })

    this remulates noiceRemedyAPI.getFormFields() with excessive cheating.
    preload the form defs on the server and place them on mezo.files with
    names matching:

        'formDefinition_${schema}' -- or --
        'formDefinitionWithMenus_${schema}'

    this function is gonna call mezo.get_file() with the corresponding name
    if it's not there, we're gonna boot with an error
    if it is there, we're gonna parse the json and toot the struct

    if force is not set boolean true, we will return the entry in this._formDefinitions
    matching schema (if it exists)
*/
getFormFields(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if ((args instanceof Object) && args.hasOwnProperty('schema') && that.isNotNull(args.schema)){
            if (
                (that._formDefinitions instanceof Object) &&
                (that._formDefinitions.hasOwnProperty(args.schema)) &&
                (! (args.hasOwnProperty('force') && (args.force == true)))
            ){
                toot(that._formDefinitions[args.schema]);
            }else{
                if (that.isAuthenticated){
                    let params = {
                        //fileName: `formDefinition${(args.hasOwnProperty('fetchMenus')&&(args.fetchMenus == true))?'WithMenus':''}_${args.schema}.json`
                        table: 'remulator.form_registry',
                        field_list: ['form_definition', 'store_definition', 'table_name'],
                        query: `form_name=eq.${args.schema}`
                    };
                    if (args.progressCallback instanceof Function){ params.progressCallback = args.progressCallback; }

                    that.getRows(params).then((resp) => {
                        if (
                            (resp instanceof Array) &&
                            (resp.length > 0) &&
                            (resp[0] instanceof Object) &&
                            (resp[0].form_definition instanceof Object)
                        ){
                            toot(Object.assign({table_name: resp[0].table_name, store_definition: resp[0].store_definition}, resp[0].form_definition));
                        }else{
                            // unparseable server response?
                            boot(new noiceException ({
                                messageType:            'server',
                                message:                `cannot parse server response`,
                                thrownByFunction:       'getFormFields',
                                thrownByFunctionArgs:   args
                            }));
                        }

                    }).catch((error) => {
                        // getFile failed, let that error speak for itself
                        boot(error);
                    });

                }else{
                    boot(new noiceException ({
                        messageType:            'internal',
                        message:                `api handle is not authenticated`,
                        thrownByFunction:       'getFormFields',
                        thrownByFunctionArgs:   args
                    }));
                }
            }
        }else{
            boot(new noiceException({
                messageType: 'internal',
                message: 'invalid input',
                thrownByFunction: 'getFormFields',
                thrownByFunctionArgs: (args instanceof Object)?args:{}
            }));
        }
    }));
}




/*
    installForm({
        form_name: <str>
        table_name: <str>
        form_definition: <json>
        store_definition: <json>
    })

    create row on remulator.form_registry identified by form_name
*/
installForm(args){
    let that = this;
    return (new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            (args.form_definition instanceof Object) &&
            //(args.store_definition instanceof Object) &&
            //args.hasOwnProperty('table_name') &&
            //that.isNotNull(args.table_name) &&
            args.hasOwnProperty('form_name') &&
            that.isNotNull(args.form_name)
        ){
            // super basic mode
            toot(that.createRow({
                table: 'remulator.form_registry',
                fields: {
                    form_name: args.form_name,
                    table_name: `${args.form_name}`.toLowerCase(),
                    store_name: args.form_name,
                    form_definition: args.form_definition,
                    store_definition: (args.store_definition instanceof Object)?args.store_definition:{},
                    entry_id_prefix: (
                        (args.store_definition instanceof Object) &&
                        (args.store_definition.idIndex instanceof Object) &&
                        args.store_definition.idIndex[1].hasOwnProperty('default_value') &&
                        that.isNotNull(args.store_definition.idIndex[1].default_value)
                )?args.store_definition.idIndex[1].default_value:''
                }
            }))
        }else{
            boot(new noiceException({
                messageType: 'internal',
                message: 'invalid input',
                thrownByFunction: 'installForm',
                thrownByFunctionArgs: (args instanceof Object)?args:{}
            }));
        }
    }));
}




/*
    createTicket({
        schema:         <formName>
        fields:         { ... },
        attachments:    { fieldName: {fileObject} ... },
        formDefinition: { ... }
    })

    direct emulation of noiceRemedyAPI.createTicket
    fieldNames are translated to `_${fieldID}`
    attachments are sent to the mezo.files table via put_file

    formDefinition is optional. If it isn't specified:

        1) we will look on this._formDefinitions
           because yeah we're gonna cache em

        2) if not present on this._formDefinitions, we're gonna fetch it again with getFormFields()

*/
createTicket(args){
    let that = this;

    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            (args.fields instanceof Object)
        ){
            if (that.isAuthenticated){

                // get the formDefinition
                Promise.resolve((args.formDefinition instanceof Object)?args.formDefinition:that.getFormFields({schema: args.schema})).then((formDefinition) => {

                    let callArgs = {
                        table: `remulator.${formDefinition.table_name}`,
                        fields: {}
                    };

                    let mungedFields = that.inputFilter(formDefinition, args.fields);

                    // convert all the fieldNames to underscore prefixed fieldIDs
                    Object.keys(mungedFields).filter((fieldName) => {return(
                        formDefinition.nameIndex.hasOwnProperty(fieldName) &&
                        (! (formDefinition.nameIndex[fieldName].datatype == "ATTACHMENT"))
                    )}).forEach((fieldName) => {
                        // set up trhe underscore fields
                        callArgs.fields[`_${formDefinition.nameIndex[fieldName].id}`] = mungedFields[fieldName];
                    });


                    // make the row (if we had attachments, we'll add them later)
                    that.createRow(callArgs).then((resp) => {


                        // fetch back the actual entry_id on _1
                        that.getRow({
                            table: callArgs.table,
                            id: resp.id,
                            fields: '_1'
                        }).then((r) => {


                            /*
                                dealin' with attachments
                                if we have any, the fileName should be on the attachment field's
                                entry on fields, and the file object should be in the attachments
                                object on the attachment fields' name

                                like: {
                                    schema: "mySchema",
                                    fields: {
                                        field_1: "a value",,
                                        attachment_field: "spreadsheet.xlsx",
                                    },
                                    attachments: {
                                        attachment_field: <byteArray>
                                    }
                                }

                                can you dig it?
                                well I mean can you really dig anything in this reality?
                                no. but on we go regardless
                            */
                            new Promise((_t, _b) => {
                                if (args.attachments instanceof Object){
                                    let putQueue = Object.keys(args.attachments).filter((fieldName) => {return(
                                        args.fields.hasOwnProperty(fieldName) &&
                                        that.isNotNull(args.fields[fieldName]) &&
                                        formDefinition.nameIndex.hasOwnProperty(fieldName)
                                    )}).map((fieldName) => {return({
                                        fileName: args.fields[fieldName],
                                        data: args.attachments[fieldName],
                                        progressCallback: (args.progressCallback instanceof Function)?args.progressCallback:null ,
                                        dbSchema: 'remulator',
                                        _fieldID: formDefinition.nameIndex[fieldName].id
                                    })});

                                    // do an itterator
                                    function recursor(idx){
                                        if (idx == putQueue.length){
                                            _t(true);
                                        }else{

                                            that.putFile(putQueue[idx]).then((putFileResp) => {
                                                if ((putFileResp instanceof Object) && putFileResp.hasOwnProperty('id')){

                                                    // grrrr
                                                    let fields = {};
                                                    fields[`_${putQueue[idx]._fieldID}`] = putFileResp.id;

                                                    // put the id on the attachment field on the record we just made
                                                    that.modifyRow({
                                                        table: callArgs.table,
                                                        id: resp.id,
                                                        fields: fields
                                                    }).then(() => {
                                                        // recurse
                                                        Promise.resolve().then(() => { recursor(idx + 1); });
                                                    }).catch((error) => {
                                                        // error updating record with file id
                                                        _b(`error updating ${resp.id} with attachment id: ${putFileResp.id} for field: ${putQueue[idx]._fieldID} | ${error}`);
                                                    })

                                                }else{
                                                    // can't parse server response
                                                    _b(`putFile() failed successfully?! cannot parse server response for attachment field: ${putQueue[idx]._fieldID}`);
                                                }
                                            }).catch((error) => {
                                                // handle failed putFile
                                                _b(`putFile() threw unexpectedly for attachment field: ${putQueue[idx]._fieldID} | ${error}`);
                                            });
                                        }
                                    }
                                    recursor(0);
                                }else{
                                    _t(false);
                                }
                            }).then((hadAttachmentsBool) => {

                                // emulate noiceRemedyAPI createTicket() response
                                toot({
                                    url: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${resp.table}?_1=eq.${r._1}`,
                                    entryId: r._1
                                });

                            }).catch((error) => {
                                boot(new noiceException ({
                                    messageNumber:          501,
                                    messageType:            'server',
                                    message:                error,
                                    thrownByFunction:       'createTicket',
                                    thrownByFunctionArgs:   args
                                }));
                            });

                        }).catch((error) => {
                            boot(new noiceException ({
                                messageNumber:          501,
                                messageType:            'server',
                                message:                `row created successfully with id: ${resp.id}, failed retrieve entry_id getRow() threw unexpectedly ${error}`,
                                thrownByFunction:       'createTicket',
                                thrownByFunctionArgs:   args,
                                errorObject:            error
                            }));
                        });

                    }).catch((error) => {
                        boot(new noiceException ({
                            messageNumber:          501,
                            messageType:            'server',
                            message:                `createRow() threw unexpectedly ${error}`,
                            thrownByFunction:       'createTicket',
                            thrownByFunctionArgs:   args,
                            errorObject:            error
                        }));
                    });

                }).catch((error) => {
                    boot(new noiceException ({
                        messageType:            'server',
                        message:                `could not get formDefinition for ${args.schema}`,
                        thrownByFunction:       'createTicket',
                        thrownByFunctionArgs:   args,
                        errorObject:            error
                    }));
                });

            }else{
                boot(new noiceException ({
                    messageType:            'internal',
                    message:                `api handle is not authenticated`,
                    thrownByFunction:       'createTicket',
                    thrownByFunctionArgs:   args
                }));
            }

        }else{
            boot(new noiceException({
                messageType: 'internal',
                message: 'invalid input',
                thrownByFunction: 'createTicket',
                thrownByFunctionArgs: (args instanceof Object)?args:{}
            }));
        }
    }));
}




/*
    getTicket({
        schema:             <form name>
        ticket:             <ticket number>
        fields:             [array, of, fieldnames, to, get, values, for]
        fetchAttachments:   true | false (default false). if true, fetch the binary data for attachments and include in .data
        progressCallback:   function(evt){ ... xhr progress event handler ... }
    })

    note fetchAttachments and progressCallback as yet unumplemented here
*/
getTicket(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            args.hasOwnProperty('ticket') &&
            that.isNotNull(args.ticket)
        ){
            if (that.isAuthenticated){

                Promise.resolve((args.formDefinition instanceof Object)?args.formDefinition:that.getFormFields({schema: args.schema})).then((formDefinition) => {

                    let callArgs = {
                        table: `remulator.${formDefinition.table_name}`,
                        idColumn: '_1',
                        id: args.ticket
                    };

                    // convert fields to field_list if we have it
                    if (args.fields instanceof Array){
                        callArgs.field_list = args.fields.filter((fieldName) => {return(
                            (formDefinition instanceof Object) &&
                            (formDefinition.nameIndex instanceof Object) &&
                            (formDefinition.nameIndex[fieldName] instanceof Object) &&
                            formDefinition.nameIndex[fieldName].hasOwnProperty('id') &&
                            that.isNotNull(formDefinition.nameIndex[fieldName].id)
                        )}).map((fieldName) => {return( `_${formDefinition.nameIndex[fieldName].id}` )})
                    }

                    that.getRow(callArgs).then((row) => {

                        // convert fieldIds back to fieldNames
                        let out = { values: {}};
                        Object.keys(row).filter((colName) => {return(
                            (/^_\d+$/.test(colName)) &&
                            (formDefinition instanceof Object) &&
                            (formDefinition.idIndex instanceof Object) &&
                            (formDefinition.idIndex.hasOwnProperty(colName.replace('_','')))
                        )}).forEach((colName) => {
                            out.values[formDefinition.idIndex[colName.replace('_','')].name] = row[colName];
                        });

                        // execute outputFilter on field values
                        that.outputFilter(formDefinition, out.values);

                        // get attachments if we have them
                        if ((args.fetchAttachments === true) && (
                            args.fields.filter((fieldName) => {return(
                                (formDefinition instanceof Object) &&
                                (formDefinition.nameIndex instanceof Object) &&
                                (formDefinition.nameIndex[fieldName] instanceof Object) &&
                                (formDefinition.nameIndex[fieldName].datatype == "ATTACHMENT")
                            )}).length > 0
                        )){

                            new Promise((_t,_b) => {
                                let fetchQueue = args.fields.filter((fieldName) => {return(
                                    (formDefinition instanceof Object) &&
                                    (formDefinition.nameIndex instanceof Object) &&
                                    (formDefinition.nameIndex[fieldName] instanceof Object) &&
                                    (formDefinition.nameIndex[fieldName].datatype == "ATTACHMENT") &&
                                    out.values.hasOwnProperty(fieldName) &&
                                    (/^\d+$/.test(out.values[fieldName]))
                                )});
                                function recursor(idx){
                                    if (idx == fetchQueue.length){
                                        toot(out);
                                    }else{
                                        that.getFile({
                                            schemaName: 'remulator',
                                            matchField: 'file_id',
                                            fileName: out.values[fetchQueue[idx]],
                                            getData: true,
                                            progressCallback: (args.progressCallback instanceof Function)?args.progressCallback:null
                                        }).then((fetchResponse) => {

                                            out.values[fetchQueue[idx]] = {
                                                name: fetchResponse.file_name,
                                                sizeBytes: fetchResponse.size,
                                                data: new Blob([fetchResponse.data])
                                            };

                                            // recurse
                                            Promise.resolve().then(() => { recursor(idx + 1); });

                                        }).catch((error) => {
                                            _b(new noiceException({
                                                messageType: 'server',
                                                message: `getFile() threw: ${error}`,
                                                thrownByFunction: 'getTicket',
                                                thrownByFunctionArgs: (args instanceof Object)?args:{},
                                                errorObject: error
                                            }))
                                        })
                                    }
                                }
                                recursor(0);
                            }).then(() => {
                                toot(out);
                            }).catch((error) => {
                                boot(error);
                            })

                        }else{
                            toot(out);
                        }

                    }).catch((error) => {
                        boot(new noiceException({
                            messageType: 'server',
                            message: `getRow() threw: ${error}`,
                            thrownByFunction: 'getTicket',
                            thrownByFunctionArgs: (args instanceof Object)?args:{},
                            errorObject: error
                        }));
                    })

                }).catch((error) => {
                    boot(new noiceException({
                        messageType: 'server',
                        message: `failed to get formDefinition, getFormFields() threw unexpectedly: ${error}`,
                        thrownByFunction: 'getTicket',
                        thrownByFunctionArgs: (args instanceof Object)?args:{},
                        errorObject: error
                    }));
                });

            }else{
                boot(new noiceException ({
                    messageType:            'internal',
                    message:                `api handle is not authenticated`,
                    thrownByFunction:       'getTicket',
                    thrownByFunctionArgs:   args
                }));
            }
        }else{
            boot(new noiceException({
                messageType: 'internal',
                message: 'invalid input',
                thrownByFunction: 'getTicket',
                thrownByFunctionArgs: (args instanceof Object)?args:{}
            }));
        }
    }));
}




/*
    query({
        schema:       <form name>
        fields:       [array, of, fieldnames, to, get, values, for] -- note add something for assoc stuff later
        QBE:          <QBE string>,
        offset:       <return data from this row number -- for paging>
        limit:        <max number of rows to return>
        sort:         <see the docs. but basically <field>.asc or <field>.desc comma separated,
        fetchAttachments: <bool>
    })

    emulation on noiceRemedyAPI.query but QBE emulation is just
    way out of scope so the 'QBE' arg we are just expecting the
    pgrest query string verbatim.

    offset, limit and sort ... we could emulate these but noiceARSSyncWorkerThread
    doesn't use them so I'm not gonna bother for now
*/
query(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            args.hasOwnProperty('QBE') &&
            that.isNotNull(args.QBE) &&
            (args.fields instanceof Array)
        ){
            if (! (that.authenticated)){
                Promise.resolve((args.formDefinition instanceof Object)?args.formDefinition:that.getFormFields({schema: args.schema})).then((formDefinition) => {

                    /*
                        to-do
                        * execute getRows()
                        * convert fields in resp back to fieldnames
                        * return emulated noiceRemedyAPI output
                        * get to lookin at how to munge all the QBEs into pgrest strings
                    */


                    let callArgs = {
                        table: `remulator.${formDefinition.table_name}`,
                        query: args.QBE
                    };

                    // convert the field list to _<fieldID>
                    callArgs.field_list = args.fields.filter((fieldName) => {return(
                        (formDefinition instanceof Object) &&
                        (formDefinition.nameIndex instanceof Object) &&
                        (formDefinition.nameIndex[fieldName] instanceof Object) &&
                        formDefinition.nameIndex[fieldName].hasOwnProperty('id') &&
                        that.isNotNull(formDefinition.nameIndex[fieldName].id)
                    )}).map((fieldName) => {return(
                        `_${formDefinition.nameIndex[fieldName].id}`
                    )});

                    // YOLO!
                    that.getRows(callArgs).then((queryResult) => {

                        /*
                            for reference, the return format nocieRemedyAPI expects:
                            {
                                entries: [
                                    {
                                        values: {<fieldName>:<value>,  ...}
                                    }
                                ]
                            }

                            queryResult should look like this:
                            [
                                { <fieldID>:value, ...}
                            ]
                        */
                        let bigOut = { entries: [] };
                        if (queryResult instanceof Array){
                            bigOut.entries = queryResult.filter((row) => {return((row instanceof Object))}).map((row) => {
                                let out = { values: {}};
                                Object.keys(row).filter((colName) => {return(
                                    (/^_\d+$/.test(colName)) &&
                                    (formDefinition instanceof Object) &&
                                    (formDefinition.idIndex instanceof Object) &&
                                    (formDefinition.idIndex.hasOwnProperty(colName.replace('_','')))
                                )}).forEach((colName) => {
                                    out.values[formDefinition.idIndex[colName.replace('_','')].name] = row[colName];
                                });

                                // execute outputFilter on field values
                                that.outputFilter(formDefinition, out.values);

                                return(out);
                            });

                            /*
                                fetchAttachments here if we've got the flag and some fields
                            */
                            new Promise((_t,_b) => {

                                if (
                                    (args.hasOwnProperty('fetchAttachments') && (args.fetchAttachments === true)) &&
                                    (args.fields instanceof Array) &&
                                    (args.fields.filter((fieldName) => {return(
                                        (formDefinition instanceof Object) &&
                                        (formDefinition.nameIndex instanceof Object) &&
                                        (formDefinition.nameIndex[fieldName] instanceof Object) &&
                                        (formDefinition.nameIndex[fieldName].datatype == "ATTACHMENT")
                                    )}).length > 0)
                                ){
                                    function recursor(idx){
                                        if (idx == bigOut.entries.length){
                                            _t(bigOut);
                                        }else{
                                            let row = bigOut.entries[idx].values;
                                            let fetchQueue = Object.keys(row).filter((fieldName) => {return(
                                                (formDefinition instanceof Object) &&
                                                (formDefinition.nameIndex instanceof Object) &&
                                                (formDefinition.nameIndex[fieldName] instanceof Object) &&
                                                (formDefinition.nameIndex[fieldName].datatype == "ATTACHMENT")
                                            )});
                                            function lilRecursor(idxx){
                                                if (idxx == fetchQueue.length){
                                                    // reassemble everything and stash back on bigOut.entries[idx].values
                                                    bigOut.entries[idx].values = row;

                                                    // then recurse the big recursor
                                                    Promise.resolve().then(() => { recursor(idx + 1); });
                                                }else{
                                                    // fetch the file
                                                    that.getFile({
                                                        schemaName: 'remulator',
                                                        matchField: 'file_id',
                                                        fileName: row[fetchQueue[idxx]],
                                                        getData: true,
                                                        progressCallback: (args.progressCallback instanceof Function)?args.progressCallback:null
                                                    }).then((fetchResponse) => {

                                                        // setup the expected data structure
                                                        row[fetchQueue[idxx]] = {
                                                            name: fetchResponse.file_name,
                                                            sizeBytes: fetchResponse.size,
                                                            data: new Blob([fetchResponse.data])
                                                        };
                                                        // recurse the lilRecursor
                                                        Promise.resolve().then(() => { lilRecursor(idxx + 1); });
                                                    }).catch((error) => {
                                                        _b(error);
                                                    });
                                                }
                                            }
                                            lilRecursor(0);
                                        }
                                    }
                                    recursor(0);
                                }else{
                                    // no attachments or flag not set
                                    _t(bigOut);
                                }


                            }).then((returnData) => {
                                toot(returnData);
                            }).catch((error) => {
                                boot(new noiceException({
                                    messageType: 'server',
                                    message: `getRows() | failed to fetch attachments: ${error}`,
                                    thrownByFunction: 'query',
                                    thrownByFunctionArgs: (args instanceof Object)?args:{},
                                    errorObject: error
                                }));
                            });
                        }else{
                            // can't parse server response?
                            boot(new noiceException({
                                messageType: 'server',
                                message: `getRows() | can't parse server response`,
                                thrownByFunction: 'query',
                                thrownByFunctionArgs: (args instanceof Object)?args:{},
                                errorObject: error
                            }));
                        }

                    }).catch((error) => {
                        if (
                            (error instanceof Object) &&
                            (error.hasOwnProperty('messageNumber')) &&
                            (error.messageNumber == 404)
                        ){
                            // no-match is an empty set for compatibility
                            toot({entries: []});
                        }else{
                            boot(new noiceException({
                                messageType: 'server',
                                message: `getRows() threw: ${error}`,
                                thrownByFunction: 'query',
                                thrownByFunctionArgs: (args instanceof Object)?args:{},
                                errorObject: error
                            }));
                        }
                    });
                }).catch((error) => {
                    boot(new noiceException({
                        messageType: 'server',
                        message: `failed to get formDefinition, getFormFields() threw unexpectedly: ${error}`,
                        thrownByFunction: 'query',
                        thrownByFunctionArgs: (args instanceof Object)?args:{},
                        errorObject: error
                    }));
                });
            }else{
                boot(new noiceException ({
                    messageType:            'internal',
                    message:                `api handle is not authenticated`,
                    thrownByFunction:       'query',
                    thrownByFunctionArgs:   args
                }));
            }
        }else{
            boot(new noiceException({
                messageType: 'internal',
                message: 'invalid input',
                thrownByFunction: 'query',
                thrownByFunctionArgs: (args instanceof Object)?args:{}
            }));
        }
    }));
}




/*
    inputFilter(formDefinition, data)
    this converts data from the remedy api format into the format needed to insert
    or update the remulator table
*/
inputFilter(formDefinition, data){
    let that = this;
    if  (
        (data instanceof Object) &&
        (formDefinition instanceof Object) &&
        (formDefinition.nameIndex instanceof Object)
    ){

        // fix epoch time conversions
        Object.keys(data).filter((fieldName) => {return(
            (formDefinition.nameIndex[fieldName] instanceof Object) &&
            formDefinition.nameIndex[fieldName].hasOwnProperty('datatype') &&
            (formDefinition.nameIndex[fieldName].datatype == "TIME") &&
            (!(/^\d+$/.test(data[fieldName])))
        )}).forEach((fieldName) => {
            data[fieldName] = that.toEpoch(data[fieldName]);
        });

        // fix currency
        Object.keys(data).filter((fieldName) => {return(
            (formDefinition.nameIndex[fieldName] instanceof Object) &&
            formDefinition.nameIndex[fieldName].hasOwnProperty('datatype') &&
            (formDefinition.nameIndex[fieldName].datatype == "CURRENCY") &&
            (data[fieldName] instanceof Object) &&
            (data[fieldName].hasOwnProperty('decimal')) &&
            (! (isNaN(parseFloat(data[fieldName].decimal))))
        )}).forEach((fieldName) => {
            data[fieldName] = parseFloat(data[fieldName].decimal);
        });

        return(data);
    }else{
        // failsafe and just return whatever the input was
        return(data);
    }
}




/*
    outputFilter(formDefinition, data);

    this munges field values from the remulator db into whatever the remedy api would have returned
    in the case of dates, we're getting epoch from the db and need to translate into that goofy iso
    format or whatever. For currency it's creating the little currency object (we're just gonna presume
    USD because 'murica)

    data should be an object of the form { <fieldName>:<val>, ... }
*/
outputFilter(formDefinition, data){
    let that = this;
    if  (
        (data instanceof Object) &&
        (formDefinition instanceof Object) &&
        (formDefinition.nameIndex instanceof Object)
    ){

        // fix epoch time conversions
        Object.keys(data).filter((fieldName) => {return(
            (formDefinition.nameIndex[fieldName] instanceof Object) &&
            formDefinition.nameIndex[fieldName].hasOwnProperty('datatype') &&
            (formDefinition.nameIndex[fieldName].datatype == "TIME") &&
            /^\d+$/.test(data[fieldName])
        )}).forEach((fieldName) => {
            data[fieldName] = that.fromEpoch(data[fieldName], 'dateTime');
        })

        // fix currency
        Object.keys(data).filter((fieldName) => {return(
            (formDefinition.nameIndex[fieldName] instanceof Object) &&
            formDefinition.nameIndex[fieldName].hasOwnProperty('datatype') &&
            (formDefinition.nameIndex[fieldName].datatype == "CURRENCY") &&
            (! (isNaN(parseFloat(data[fieldName]))))
        )}).forEach((fieldName) => {
            data[fieldName] = {
                decimal: parseFloat(data[fieldName]),
                currency: 'USD'
            };
        });

        return(data);

    }else{
        // failsafe and just return whatever the input was
        return(data);
    }
}



}
export { noiceMezoRemulatorAPI };
