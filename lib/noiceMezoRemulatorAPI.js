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
                        field_list: ['form_definition', 'table_name'],
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
                            toot(Object.assign({table_name: resp[0].table_name}, resp[0].form_definition));
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

                    // convert all the fieldNames to underscore prefixed fieldIDs
                    Object.keys(fields).filter((fieldName) => {return(
                        formDefinition.nameIndex.hasOwnProperty(fieldName)
                    )}).forEach((fieldName) => {
                        /*
                            LOH 2/3/25 @ 1652 -- COB
                            need to filter attachment fields above
                            need to pull a formDef with an attachment field to
                            look at how that appears in the def

                            but you get it. right here we translate fieldNames into
                            _<fieldId> strings and setup a createRow() on formDefinition.table_name
                            
                        */
                    })




                    /*
                        LOH -- need to code this up
                        basically:
                            1) [DONE 1/24/25 @ 2356] fill out the sanity check if statement above
                            2) [WIP] convert the schema to a tableName

                               LOH 1/24/25 @ 2356
                               knowing the table_name from the schema_name is gonna require some
                               db integration. So I created remulator.form_registry
                               and in doing so remembered about jsonb columns
                               this is where the formDef and the storeDef should reside
                               not mezo.files. Steps:

                                A) [DONE 1/31/25 @ 1539] create form_registry rows for all the forms
                                    -> including the formDef and the storeDef on the json columns

                                    1) [DONE 1/31/25 @ 1539] create an installForm() function above
                                       gotta work out the kinks with the jsonb datatype thing


                                B) [DONE 2/3/25 @ 1630] rewrite getFormFields above to query remulator.form_registry
                                    -> rather than mezo.files
                                    -> include .table_name in the output struct of getFormFields
                                    -> if the formDef is manually specified on the function call, it
                                    -> too must contain .table_name

                                C) rewrite tableGenerator.js to execute off a query to form_registry
                                    -> not as part of the app with hard-coded config imports for the
                                       two data inputs -- later

                            3) [WIP] convert all the fieldNames to fieldIDs
                            4) if there are attachments:
                               delete the fields entry corresponding to the attachment field
                            5) call noiceMezoAPI.createRow(with table, fields)
                            6) if there are attachments:
                                1) create them via mezo.put_file()
                                2) place the file_id into the attachment field on the primary form

                        this has a prerequisite and it goes back to tableGenerator.js
                        when we encounter attachment fields, we need to model them as integers
                        that will contain a mezo.files.id value

                        when we do getTicket() with fetchAttachments we're gonna have to do the reverse
                        call getFile() with the ID

                        which also means we need a getFileByID() function. getFile() works great by name
                        but we are going to have to munge names or something because name cannot be a unique
                        index. In fact we may need to simply implement
                        remulator.files / remulator.getFile() / remulator.putFile()
                        because these have different cardinailty rules than mezo.files which kinda serve
                        a different purpose
                    */


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
