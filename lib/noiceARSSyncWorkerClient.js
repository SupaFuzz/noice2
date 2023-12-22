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



}
export { noiceARSSyncWorkerClient };
