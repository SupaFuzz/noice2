/*
    noiceMezoAPI.js
    this extends noicePGRestAPI to implement Mezo specific
    functions n such
*/
'use strict';
import { noicePGRestAPI } from './noicePGRestAPI.js';
import { noiceException } from './noiceCore.js';

class noiceMezoAPI extends noicePGRestAPI {




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
        _className: 'noiceMezoAPI',
        debug: false,
        protocol: 'https',
        proxyPath: null,
        token: null
    });
} // end constructor




/*
    putFile({
        fileName: <str>,
        data: <Uint8Array>,
        progressCallback: <function(receivedBytes, totalBytes, completeBool)>
    })

    create a record on mezo.files with the specified fileName
    and binary data. If progressCallback is speciufied call it with progress info

    NOTE: progressCallback is to-do
*/
putFile(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('fileName') &&
            that.isNotNull(args.fileName) &&
            (args.data instanceof Uint8Array)
        ){
            that.apiFetch({
                endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/rpc/put_file`,
                method: 'POST',
                expectHtmlStatus: 200,
                responseType: 'text',
                headers: {
                  'Authorization': `Bearer ${that.token}`,
                  'Content-Type': 'application/octet-stream',
                  'Content-Profile': 'mezo',
                  'X-filename': args.fileName
                },
                body: new Blob([args.data], { type: 'application/octet-stream' })
            }).then((r) => {
                toot({id: r});
            }).catch((error) => {
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'server',
                    message: `rest call failed: ${error}`,
                    thrownBy: `${that._className} v${that._version} | putFile()`,
                    args: args,
                    errorObject: error
                }));
            })
        }else{
            boot(new noiceException({
                messageNumber: 400,
                messageType: 'internal',
                message: `invalid input`,
                thrownBy: `${that._className} v${that._version} | putFile()`,
                args: args
            }));
        }
    }));
}




/*
    getFile({
        fileName:           <str>,
        getData:            <bool, default: true> // TO-DO
        progressCallback:   <function(receivedBytes, totalBytes, completeBool)>
    })

    fetch the specified file_id from mezo.files
    returning this datastructure:
    {
        type: <mimeType>,
        file_name: <str>,
        size: <int>,
        last_modified: <date>,
        data: <Uint8Array>
    }

    if getData is false, do not include the 'data' key above

    if progressCallback is specified call that with progress info as data is retrieved

    NOTE: getData is still to-do ... actually might be better modeled as a
    getFileMeta or something I dunno
*/
getFile(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('fileName') &&
            that.isNotNull(args.fileName)
        ){

            let fetchArgs = {
                endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/rpc/get_file?file_name=${args.fileName}`,
                method: 'GET',
                expectHtmlStatus: 200,
                responseType: 'headersAndBuffer',
                headers: {
                  'Authorization': `Bearer ${that.token}`,
                  'Accept': 'application/octet-stream',
                  'Accept-Profile': 'mezo'
                }
            }
            if (args.progressCallback instanceof Function){ fetchArgs.progressCallback = args.progressCallback; }
            that.apiFetch(fetchArgs).then((resp) => {
                if (
                    (resp instanceof Object) &&
                    resp.hasOwnProperty('headers') &&
                    resp.hasOwnProperty('buffer')
                ){
                    toot({
                        type: resp.headers.get('Content-Type'),
                        file_name: resp.headers.get('X-Filename'),
                        size: resp.headers.get('Content-Length'),
                        last_modified: resp.headers.get('X-filedate'),
                        data: resp.buffer
                    });
                }else{
                    // error: unknown server response
                    boot(new noiceException({
                        messageNumber: 422,
                        messageType: 'internal',
                        message: `cannot parse server response, missing headers or payload`,
                        thrownBy: `${that._className} v${that._version} | getFile()`,
                        args: args
                    }));
                }
            }).catch((error) => {
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'server',
                    message: `rest call failed: ${error}`,
                    thrownBy: `${that._className} v${that._version} | getFile()`,
                    args: args,
                    errorObject: error
                }));
            });
        }else{
            boot(new noiceException({
                messageNumber: 400,
                messageType: 'internal',
                message: `invalid input`,
                thrownBy: `${that._className} v${that._version} | getFile()`,
                args: args
            }));
        }
    }));
}




/*
    LOH 1/10/25 @ 1625
    everything above works.
    to-do list:

        * progressCallback on putFile()
          will require flipping to the XHR interface for the POST
          but should be doable

        * getData (bool)
          just put a switch in to query all the fields except
          blob and set the return data struct and be out
*/




}
export { noiceMezoAPI };
