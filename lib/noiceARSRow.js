/*
    noiceARSRow.js
    Amy Hicox <amy@hicox.com> 4/3/24

    this extends the noiceCoreRow class for integration to rows on indexedDB datastores
    managed by a noiceARSSyncWorker
*/
import { noiceObjectCore, noiceException, noiceCoreChildClass } from './noiceCore.js';
import { noiceCoreRow } from './noiceCoreRow.js';
import { noiceARSSyncWorkerClient } from './noiceARSSyncWorkerClient.js';
class noiceARSRow extends noiceCoreRow {




/*
    constructor({

    })
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:     1,
        _className:   'noiceARSRow',
        threadClient: null,           // we gonna need a noiceARSSyncWorkerClient
        formName:     null           // we're gonna need a name to pull the formDef outa the client
    },defaults),callback);

    // gots ta maintaiiin ... data integrity that is :-)
    if (! this.threadClient instanceof noiceARSSyncWorkerClient){
        throw(new noiceException({
            errorNumber: 1,
            message: 'threadClient is not instance of noiceARSSyncWorkerClient',
            thrownBy: `noiceARSRow constructor()`
        }));
    }
    if (! this.isNotNull(this.formName)){
        throw(new noiceException({
            errorNumber: 2,
            message: 'formName cannot be null',
            thrownBy: `noiceARSRow constructor()`
        }));
    }
    if (! (
        (this.threadClient.threadInfo instanceof Object) &&
        (this.threadClient.threadInfo.formDefinitions instanceof Object) &&
        (this.threadClient.threadInfo.formDefinitions[this.formName] instanceof Object)
    )){
        throw(new noiceException({
            errorNumber: 3,
            message: 'specified formName is not managed by specified threadClient',
            thrownBy: `noiceARSRow constructor()`
        }));
    }


    // do init stuffs here, yo!
    that.initFormFields();
}




/*
    initFormFields()
    pull the formDefinition corresponding to this.formName and mutate it into a fieldConfig
    then install that fieldConfig
*/
initFormFields(){

    /*
        LOH 4/3/24 @ 1658 -- COB
        yeah boyeee ... next up! writing a config mangler!
    */

}



}
export { noiceARSRow };
