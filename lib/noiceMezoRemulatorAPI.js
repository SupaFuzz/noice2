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
        progressCallback: <function(receivedBytes, totalBytes, completeBool)>
    })

    this remulates noiceRemedyAPI.getFormFields() with excessive cheating.
    preload the form defs on the server and place them on mezo.files with
    names matching:

        'formDefinition_${schema}' -- or --
        'formDefinitionWithMenus_${schema}'

    this function is gonna call mezo.get_file() with the corresponding name
    if it's not there, we're gonna boot with an error
    if it is there, we're gonna parse the json and toot the struct
*/
getFormFields(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if ((args instanceof Object) && args.hasOwnProperty('schema') && that.isNotNull(args.schema)){
            if (that.isAuthenticated){
                let params = { fileName: `formDefinition${(args.hasOwnProperty('fetchMenus')&&(args.fetchMenus == true))?'WithMenus':''}_${args.schema}.json` };
                if (args.progressCallback instanceof Function){ params.progressCallback = args.progressCallback; }

                that.getFile(params).then((fileObject) => {
                    if ((fileObject instanceof Object) && (fileObject.data instanceof Uint8Array)){

                        // nfg mode right here
                        toot(JSON.parse(new TextDecoder('utf-8').decode(fileObject.data)));

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
                })
            }else{
                boot(new noiceException ({
                    messageType:            'internal',
                    message:                `api handle is not authenticated`,
                    thrownByFunction:       'getFormFields',
                    thrownByFunctionArgs:   args
                }));
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
createTicket(p){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('schema') &&
            that.isNotNull(args.schema) &&
            // lots more here
        ){
            if (that.isAuthenticated){

                // do stuff

                /*
                    LOH -- need to code this up
                    basically:
                        1) fill out the sanity check if statement above
                        2) convert the schema to a tableName
                        3) convert all the fieldNames to fieldIDs
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




export { noiceMezoRemulatorAPI };
