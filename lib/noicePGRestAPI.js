/*
    noicePGRestAPI.js
    1/3/25  Amy Hicox <amy@hicox.com>

    this is a quick and dirty client for postgrest
*/
'use strict';
import { noiceCoreNetworkUtility, noiceException } from './noiceCore.js';

class noicePGRestAPI extends noiceCoreNetworkUtility {




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
        _className: 'noicePGRestAPI',
        debug: false,
        protocol: 'https',
        proxyPath: null,
        token: null
    });

    // sort out the protocol and default ports
    switch (this.protocol){
        case 'https':
            if (! this.hasAttribute('port')){ this.port = 443; }
        break;
        case 'http':
            if (! this.hasAttribute('port')){ this.port = 80; }
        break;
        default:
            throw(new noiceException({
                messageType:    'internal',
                message:        `unsupported protocol: ${this.protocol}`
            }));
    }

} // end constructor




/*
    authenticate({
        user: <str>,
        password: <str>
    })

    authenticates the specified user/password and sets internal .token
*/
authenticate(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('user') &&
            that.isNotNull(args.user) &&
            args.hasOwnProperty('password') &&
            that.isNotNull(args.password)
        ){
            that.apiFetch({
                endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/rpc/login`,
                method: 'POST',
                expectHtmlStatus: 200,
                responseType: 'json',
                body: { email: args.user, pass: args.password },
                encodeBody: true,
                headers: { 'Content-Type': 'application/json' }
            }).then((resp) => {
                if ((resp instanceof Object) && (resp.hasOwnProperty('token')) && that.isNotNull(resp.token)){
                    this.token = resp.token;
                    toot(that);
                }else{
                    // no token in reponse?!
                    this.token = null;
                    boot(new noiceException({
                        messageNumber: 422,
                        messageType: 'internal',
                        message: `cannot parse server response, no token`,
                        thrownBy: `${that._className} v${that._version} | authenticate()`
                    }));
                }
            }).catch((error) => {
                // api call failed
                this.token = null;
                boot(new noiceException({
                    messageNumber: 511,
                    messageType: 'server',
                    message: `authentication failed`,
                    thrownBy: `${that._className} v${that._version} | authenticate()`,
                    errorObject: error
                }));
            });
        }else{
            boot(new noiceException({
                messageNumber: 400,
                messageType: 'internal',
                message: `invalid input`,
                thrownBy: `${that._className} v${that._version} | authenticate()`
            }));
        }
    }))
}




/*
    isAuthenticated (bool)
    true if we have a token
*/
get isAuthenticated(){ return(this.hasOwnProperty("token") && this.isNotNull(this.token)); }




/*
    getRow({
        table: <str>
        id:    <str>,
        field_list: [<str>, <str>, ...]
    })

    what it says on the tin
*/
getRow(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (that.isAuthenticated){
            if (
                (args instanceof Object) &&
                args.hasOwnProperty('table') &&
                that.isNotNull(args.table) &&
                args.hasOwnProperty('id') &&
                that.isNotNull(args.id)
            ){
                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${args.table}?id=eq.${args.id}${(
                        (args.field_list instanceof Array) &&
                        (args.field_list.length > 0)
                    )?`&select=${args.field_list.join(',')}`:''}`,
                    method: 'GET',
                    expectHtmlStatus: 200,
                    responseType: 'json',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${that.token}`
                    }
                }).then((resp) => {
                    if ((resp instanceof Array) && (resp.length > 0)){
                        toot(resp[0]);
                    }else{
                        boot(new noiceException({
                            messageNumber: 404,
                            messageType: 'server',
                            message: 'no match',
                            thrownBy: `${that._className} v${that._version} | getRow()`,
                            args: args
                        }));
                    };
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 501,
                        messageType: 'server',
                        message: `apiFetch() threw: ${error}`,
                        thrownBy: `${that._className} v${that._version} | getRow()`,
                        args: args,
                        errorObject: error
                    }));
                })
            }else{
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'internal',
                    message: `invalid input`,
                    thrownBy: `${that._className} v${that._version} | getRow()`,
                    args: args
                }));
            }
        }else{
            boot(new noiceException({
                messageNumber: 401,
                messageType: 'internal',
                message: `not authenticated`,
                thrownBy: `${that._className} v${that._version} | getRow()`,
                args: args
            }));
        }
    }))
}




/*
    createRow({
        table: <str>,
        fields: { <fieldName>:<val>, ...}
    })
*/
createRow(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (that.isAuthenticated){

            if (
                (args instanceof Object) &&
                args.hasOwnProperty('table') &&
                that.isNotNull(args.table) &&
                (args.fields instanceof Object) &&
                (Object.keys(args.fields).length > 0)
            ){
                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${args.table}`,
                    method: 'POST',
                    expectHtmlStatus: 201,
                    responseType: 'json',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${that.token}`,
                        'Content-Profile': 'mezo'
                    },
                    body: args.fields,
                    encodeBody: true
                }).then((resp) => {
                    toot(resp);
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `creaateRow() failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | createRow()`,
                        args: args,
                        errorObject: error
                    }));
                })
            }else{
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'internal',
                    message: `invalid input`,
                    thrownBy: `${that._className} v${that._version} | createRow()`,
                    args: args
                }));
            }
        }else{
            boot(new noiceException({
                messageNumber: 401,
                messageType: 'internal',
                message: `not authenticated`,
                thrownBy: `${that._className} v${that._version} | createRow()`,
                args: args
            }));
        }
    }));
}




/*
    1/4/25 @ 1122
    all of the above works now. next up:

    * logout()
    * createRow()
    * modifyRow()
    * deleteRow()
    * getRowsModifiedSince(<date>)
    * queryRows() -- just accept the query in postgrest form and pass through
*/




}
export { noicePGRestAPI };
