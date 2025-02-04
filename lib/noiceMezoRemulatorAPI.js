/*
    noiceMezoRemulatorAPI.js
    extends noiceMezoAPI to include functions necessary for
    remulation on the mezo platform
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
            (args.store_definition instanceof Object) &&
            args.hasOwnProperty('table_name') &&
            that.isNotNull(args.table_name) &&
            args.hasOwnProperty('form_name') &&
            that.isNotNull(args.form_name)
        ){
            // super basic mode
            toot(that.createRow({
                table: 'remulator.form_registry',
                fields: {
                    form_name: args.form_name,
                    table_name: args.form_name,
                    form_definition: args.form_definition,
                    store_definition: args.store_definition
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

                    // convert all the fieldNames to underscore prefixed fieldIDs
                    Object.keys(args.fields).filter((fieldName) => {return(
                        formDefinition.nameIndex.hasOwnProperty(fieldName) &&
                        (! (formDefinition.nameIndex[fieldName].datatype == "ATTACHMENT"))
                    )}).forEach((fieldName) => {
                        callArgs.fields[`_${formDefinition.nameIndex[fieldName].id}`] = args.fields[fieldName];
                    });

                    // make the row (if we had attachments, we'll add them later)
                    that.createRow(callArgs).then((resp) => {

                        /*
                            LOH 2/4/25 @ 1215 -- LUNCH
                            support for attachments:

                                1) tableGenerator.js
                                   model attachment fields as an integer field

                                2) remulator_common.js
                                   copy mezo.getFile() but by id instead of name
                                   also mezo.files, mezo.putFile(), etc

                                3) inside this block
                                   call remulator.putFile(), get back the file_id, update the
                                   record we just created setting the file_id on the attachment
                                   _<fieldID> field

                                4) getTicket() and query() with getAttachments flag set
                                   pull the file from getFile and merge into result as
                                   byteArray or what have you

                            automated tableGenerator.js
                                * basically at least rewrite it to pull the def and the storeDef
                                  from remulator.form_registry. We can talk about hooking it up
                                  inside the mezo_server node listener process later

                            there's a problem with the primary indexes on _1
                            these are going to contain legit ARS entry_ids which aren't part of
                            of the built in postgres 'serial primary key' automation and that's not
                            great.

                            we gotta have some kinda "use the sequence if you weren't given a value"
                            on create type situation. UGH

                            OR -- ok. maybe a local 'id' that is the sequence and the _1 field is for
                            server sync? grrr. thing is this should work with or without an external
                            system of record to even get a _1 entryid value for

                            gotta think on this.

                            1342 OK -- so technically it's *already* a "use the sequence if value not given"
                            situation. you can specify your own IDs and if they don't violate a unique index
                            we'll use 'em. Sweet.

                            BUT -- ok this is the problem. ARS entryIds are strings.
                            these are integers.
                            so if we can find a way to specify the serial primary key sequence thing
                            coerced into a string ... then we're good to barrel ahead

                            LOH 2/4/25 @ 1647 in mezo.remulator_common.sql #76
                        */

                        // emulate noiceRemedyAPI createTicket() response
                        toot({
                            url: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${resp.table}?_1=eq.${resp.id}`,
                            entryId: resp.id
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




}
export { noiceMezoRemulatorAPI };
