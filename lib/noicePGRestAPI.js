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

                // setup default headers
                let hdrs = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${that.token}`
                };

                // sort out schema dot notation for Accept-Profile
                let table = `${args.table}`;
                let a = table.match(/(.+)\.(.+)/);
                if (a instanceof Array){
                    table = a[2];
                    hdrs['Accept-Profile'] = a[1];
                }

                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${table}?id=eq.${args.id}${(
                        (args.field_list instanceof Array) &&
                        (args.field_list.length > 0)
                    )?`&select=${args.field_list.join(',')}`:''}`,
                    method: 'GET',
                    expectHtmlStatus: 200,
                    responseType: 'json',
                    headers: hdrs
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

    note if 'table' is in a schema other than 'api', to make this work
    we need to specify the Content-Profile header so postgrest can find
    the table to write to. In such cases, use dot notation like:
    <schema>.<table> -- for instance mezo.nthree_albums
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
                // setup default headers
                let hdrs = {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=headers-only',
                    'Authorization': `Bearer ${that.token}`,

                };

                // sort out schema dot notation for Content-Profile
                let table = `${args.table}`;
                let a = table.match(/(.+)\.(.+)/);
                if (a instanceof Array){
                    table = a[2];
                    hdrs['Content-Profile'] = a[1];
                }

                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${table}`,
                    method: 'POST',
                    expectHtmlStatus: 201,
                    responseType: 'headers',
                    headers: hdrs,
                    body: args.fields,
                    encodeBody: true
                }).then((resp) => {
                    let loc = resp.get('Location');
                    if (that.isNotNull(loc)){
                        let a = `${loc}`.match(/id=eq\.(.+)/);
                        if (a instanceof Array){
                            toot({
                                id: a[1],
                                table: `${(hdrs.hasOwnProperty('Content-Profile') && that.isNotNull(hdrs['Content-Profile']))?`${hdrs['Content-Profile']}.`:''}${table}`
                            });
                        }else{
                            toot({
                                table: `${(hdrs.hasOwnProperty('Content-Profile') && that.isNotNull(hdrs['Content-Profile']))?`${hdrs['Content-Profile']}.`:''}${table}`,
                                id: null,
                                message: "row successfully created, but cannot parse id from server response"
                            });
                        }
                    }
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
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
    modifyRow({
        table: <str>,
        id: <str>,
        fields: { <fieldName>:<value>, ... }
    })

    it is what it looks like
*/
modifyRow(args){
    let that = this;
    return(new Promise((toot, boot) => {
        let that = this;
        return(new Promise((toot, boot) => {
            if (that.isAuthenticated){

                if (
                    (args instanceof Object) &&
                    args.hasOwnProperty('table') &&
                    that.isNotNull(args.table) &&
                    args.hasOwnProperty('id') &&
                    that.isNotNull(args.id) &&
                    (args.fields instanceof Object) &&
                    (Object.keys(args.fields).length > 0)
                ){
                    // setup default headers
                    let hdrs = {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=headers-only',
                        'Authorization': `Bearer ${that.token}`
                    };

                    // sort out schema dot notation for Content-Profile
                    let table = `${args.table}`;
                    let a = table.match(/(.+)\.(.+)/);
                    if (a instanceof Array){
                        table = a[2];
                        hdrs['Content-Profile'] = a[1];
                    }

                    that.apiFetch({
                        endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${table}?id=eq.${args.id}`,
                        method: 'PATCH',
                        expectHtmlStatus: 204,
                        responseType: 'headers',
                        headers: hdrs,
                        body: args.fields,
                        encodeBody: true
                    }).then((resp) => {
                        toot(true);
                    }).catch((error) => {
                        boot(new noiceException({
                            messageNumber: 400,
                            messageType: 'server',
                            message: `rest call failed: ${error}`,
                            thrownBy: `${that._className} v${that._version} | modifyRow()`,
                            args: args,
                            errorObject: error
                        }));
                    })
                }else{
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'internal',
                        message: `invalid input`,
                        thrownBy: `${that._className} v${that._version} | modifyRow()`,
                        args: args
                    }));
                }
            }else{
                boot(new noiceException({
                    messageNumber: 401,
                    messageType: 'internal',
                    message: `not authenticated`,
                    thrownBy: `${that._className} v${that._version} | modifyRow()`,
                    args: args
                }));
            }
        }));
    }));
}




/*
    deleteRow({
        table: <str>,
        id: <str>,
    })

    on success, this returns the record you just deleted in full

    use with caution.
    actually y'know ... make sure mezo perms are locked down m'kay?
*/
deleteRow(args){
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
                // setup default headers
                let hdrs = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${that.token}`,
                    'Prefer': 'return=representation'
                };

                // sort out schema dot notation for Content-Profile
                let table = `${args.table}`;
                let a = table.match(/(.+)\.(.+)/);
                if (a instanceof Array){
                    table = a[2];
                    hdrs['Content-Profile'] = a[1];
                }

                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${table}?id=eq.${args.id}`,
                    method: 'DELETE',
                    expectHtmlStatus: 200,
                    responseType: 'json',
                    headers: hdrs,
                    body: args.fields,
                    encodeBody: true
                }).then((resp) => {
                    toot(((resp instanceof Array) && (resp.length > 0))?resp[0]:resp);
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | deleteRow()`,
                        args: args,
                        errorObject: error
                    }));
                })
            }else{
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'internal',
                    message: `invalid input`,
                    thrownBy: `${that._className} v${that._version} | deleteRow()`,
                    args: args
                }));
            }
        }else{
            boot(new noiceException({
                messageNumber: 401,
                messageType: 'internal',
                message: `not authenticated`,
                thrownBy: `${that._className} v${that._version} | deleteRow()`,
                args: args
            }));
        }
    }));
}




/*
    getRows({
        table: <str>,
        field_list: [<str>, ...],
        query: <str>
    })

    very dumb and prolly dangerous to be honest
    simply passing a string through to the url is ... shady ... to say the least
    but hell yolo

    some examples:

    query: `artist=ilike(all).{toad*}`


    but eventually
    here's where we're going:

    getRows({
        table: <str>,
        field_list: [<str>, ...],
        filters: [ <filter>, ...]
    })

    get the specified field_list (or all fields) for all rows on the specified
    table, applying the given filters.

    filters is an array, where each filter object is chained with an "and"
    "anded" filters can embed an "or" filter

    helpful resources:

    this guy built something like a query string builder but it's super awkward. steal some of this:
    https://github.com/calebmer/postgrest-client/blob/master/lib/ApiRequest.js

    the actual postgrest querying documentation:
    https://docs.postgrest.org/en/v12/references/api/tables_views.html#get-and-head

    once we have a way of translating a data structure into a postgrest query string
    then ... we go the other way and build a QBE parser that spits out the same
    data structure. you see where I'm going here, surely.

*/
getRows(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (that.isAuthenticated){
            if (
                (args instanceof Object) &&
                args.hasOwnProperty('table') &&
                that.isNotNull(args.table)
            ){

                // setup default headers
                let hdrs = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${that.token}`
                };

                // sort out schema dot notation for Accept-Profile
                let table = `${args.table}`;
                let a = table.match(/(.+)\.(.+)/);
                if (a instanceof Array){
                    table = a[2];
                    hdrs['Accept-Profile'] = a[1];
                }

                // this needs work lolz
                let queryStr = args.hasOwnProperty('query')?args.query:'';

                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${table}?${queryStr}${(
                        (args.field_list instanceof Array) &&
                        (args.field_list.length > 0)
                    )?`${that.isNotNull(queryStr)?'&':''}select=${args.field_list.join(',')}`:''}`,
                    method: 'GET',
                    expectHtmlStatus: 200,
                    responseType: 'json',
                    headers: hdrs
                }).then((resp) => {
                    if ((resp instanceof Array) && (resp.length > 0)){
                        toot(resp);
                    }else{
                        boot(new noiceException({
                            messageNumber: 404,
                            messageType: 'server',
                            message: 'no match',
                            thrownBy: `${that._className} v${that._version} | getRows()`,
                            args: args
                        }));
                    };
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 501,
                        messageType: 'server',
                        message: `apiFetch() threw: ${error}`,
                        thrownBy: `${that._className} v${that._version} | getRows()`,
                        args: args,
                        errorObject: error
                    }));
                })
            }else{
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'internal',
                    message: `invalid input`,
                    thrownBy: `${that._className} v${that._version} | getRows()`,
                    args: args
                }));
            }
        }else{
            boot(new noiceException({
                messageNumber: 401,
                messageType: 'internal',
                message: `not authenticated`,
                thrownBy: `${that._className} v${that._version} | getRows()`,
                args: args
            }));
        }
    }))
}




/*
    mergeRows({
        table: <str>,
        rows: [ {row}, ... ]
    })

    aka "upsert" -- merge rows with the same id
    otherwise your standard create or update
*/
mergeRows(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (that.isAuthenticated){

            if (
                (args instanceof Object) &&
                args.hasOwnProperty('table') &&
                that.isNotNull(args.table) &&
                (args.rows instanceof Array) &&
                (args.rows.length > 0) &&
                (args.rows.filter((a) => {return(a instanceof Object)}).length == args.rows.length)
            ){
                // setup default headers
                let hdrs = {
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,missing=default,return=representation',
                    'Authorization': `Bearer ${that.token}`
                };

                // sort out schema dot notation for Content-Profile
                let table = `${args.table}`;
                let a = table.match(/(.+)\.(.+)/);
                if (a instanceof Array){
                    table = a[2];
                    hdrs['Content-Profile'] = a[1];
                }

                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/${table}`,
                    method: 'POST',
                    expectHtmlStatus: 201,
                    responseType: 'json',
                    headers: hdrs,
                    body: args.rows,
                    encodeBody: true
                }).then((resp) => {
                    toot(resp);
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | mergeRows()`,
                        args: args,
                        errorObject: error
                    }));
                })
            }else{
                boot(new noiceException({
                    messageNumber: 400,
                    messageType: 'internal',
                    message: `invalid input`,
                    thrownBy: `${that._className} v${that._version} | mergeRows()`,
                    args: args
                }));
            }
        }else{
            boot(new noiceException({
                messageNumber: 401,
                messageType: 'internal',
                message: `not authenticated`,
                thrownBy: `${that._className} v${that._version} | mergeRows()`,
                args: args
            }));
        }
    }));
}




/*
    1/6/25 @ 2000
    all of the above works.
    to-do:

    * logout()
    * getRowsModifiedSince(<date>)
    * mergeRows() -- bulk insert aka "upsert"
    * queryRows() -- just accept the query in postgrest form and pass through
*/




}
export { noicePGRestAPI };
