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
            args.hasOwnProperty(user) &&
            that.isNotNull(args.user) &&
            args.hasOwnProperty(password) &&
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
                    boot(`${that._className} v${that._version} | authenticate() | cannot parse server response, no token`);
                }
            }).catch((error) => {
                // api call failed
                this.token = null;
                boot(`${that._className} v${that._version} | authenticate() | authentication failed`);
            });
        }else{
            boot(`${that._className} v${that._version} | authenticate() | invalid input`);
        }
    }))
}




/*
    isAuthenticated (bool)
    true if we have a token
*/
get isAuthenticated(){ return(this.hasOwnProperty("token") && this.isNotNull(this.token)); }




/*
    logout()
    destroy the session token on the server
    TO-DO
*/
logout(){
    let that = this;
    return(new Promise((toot, boot) => {
        /*
            1/3/25 @ 2300
            loose end: i have no idea how to do this on postgrest
        */
    }))
}




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
                        'Content-Profile': 'mezo',
                        'Authorization': `Bearer ${that.token}`
                    }
                }).then((resp) => {
                    toot(resp);
                }).catch((error) => {
                    boot(`${that._className} v${that._version} | getRow(${JSON.stringify(args)}) | apiFetch() threw: ${error}`);
                })
            }else{
                boot(`${that._className} v${that._version} | getRow(${JSON.stringify(args)}) | invalid input`);
            }
        }else{
            boot(`${that._className} v${that._version} | getRow(${JSON.stringify(args)}) | not authenticated`);
        }
    }))
}

/*
    1/3/25 @ 2349
    no idea if any of the above works but next steps:

        * get it to compile
        * get it working
        * add the rest of the crud stuffs
*/



}
export { noicePGRestAPI };
