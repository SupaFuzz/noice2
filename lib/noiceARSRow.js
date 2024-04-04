/*
    noiceARSRow.js
    Amy Hicox <amy@hicox.com> 4/3/24

    this extends the noiceCoreRow class for integration to rows on indexedDB datastores
    managed by a noiceARSSyncWorker

    ATTRIBUTES
        * formName           <str> default: null, required
        * threadClient       <noiceARSSyncWorkerClient> default: null, required
        * auxFieldConfig     <object {<fieldID>:{configOptions}, ...}
        * mode               <enum [modify|create]> default: modify
        * modeChangeCallback <function(mode, oldMode, selfRef)>
        * entryId            <str> - gets the value of whatever field is #1 in the rowData or null

    FUNCTIONS
        * initFormFields()  - called from constructor, fetches ars formDef from threadClient,
                              mangles it and installs it as the fieldConfig

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
        _mode:        'modify',
        _entryId:     null,
        threadClient: null,           // we gonna need a noiceARSSyncWorkerClient
        formName:     null,           // we're gonna need a name to pull the formDef outa the client
        auxFieldConfig: {},
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
    this.initFormFields();
}




/*
    mode
    enum: modify | create
*/
get mode(){ return(this._mode); }
set mode(v){
    if (['create', 'modify'].indexOf(v) >= 0){
        let bkp = this._mode;
        this._mode = v;
        if (this.modeChangeCallback instanceof Function){ this.modeChangeCallback(this._mode, bkp, this); }

    }else{
        throw(new noiceException({
            errorNumber: 4,
            message: 'invalid value',
            thrownBy: `${this._className}.mode (attribute setter)`
        }));
    }
}




/*
    entryId
    return the value of whatever dataElement has id:1
    if mode:'create' this will be a GUID more than likely
*/
get entryId(){
    let b = Object.keys(this.dataElements).filter((fieldName) => {return(this.dataElements[fieldName].id == 1)}, this);
    if (b.length > 0){
        return(this.dataElements[b[0]].value);
    }else{
        return(null);
    }
}




/*
    initFormFields()
    pull the formDefinition corresponding to this.formName and mutate it into a fieldConfig
    then install that fieldConfig
*/
initFormFields(){
    let out = {};
    Object.keys(this.threadClient.threadInfo.formDefinitions[this.formName].nameIndex).forEach((fieldName) => {
        let shawty = this.threadClient.threadInfo.formDefinitions[this.formName].nameIndex[fieldName];
        out[fieldName] = {
            id: shawty.id,
            type: shawty.datatype,
            nullable: (!(shawty.hasOwnProperty('field_option') && (shawty.field_option == "REQUIRED")))
        };

        // merge limits (length, enum values, etc)
        if (shawty.limit instanceof Object){
            if (shawty.limit.hasOwnProperty('max_length')){ out[fieldName].length = shawty.limit.max_length; }
            if ((shawty.datatype == "ENUM") && (shawty.limit.selection_values instanceof Array)){
                out[fieldName].values = shawty.limit.selection_values.sort((a,b) => {return(parseInt(a.id) - parseInt(b.id))}).map((o) => { return(o.name) })
            }
        }

        // merge auxFieldConfig properties if we have them (field config not originating from ARS formDef)
        if (this.auxFieldConfig[fieldName] instanceof Object){
            out[fieldName] = Object.assign({}, out[fieldName], this.auxFieldConfig[fieldName]);
        }

        // set up dbColName, which should be fieldID or indexName
        out[fieldName].dbColName = (
            (this.threadClient.threadInfo.formIndexMappings instanceof Object) &&
            (this.threadClient.threadInfo.formIndexMappings[this.formName] instanceof Object) &&
            this.threadClient.threadInfo.formIndexMappings[this.formName].hasOwnProperty(out[fieldName].id)
        )?this.threadClient.threadInfo.formIndexMappings[this.formName][out[fieldName].id]:out[fieldName].id;

    }, this);
    this.fieldConfig = out;
}




/*
    load(entryId)
    fetches the row identified by `entryId` on the this.formName from the
    indexedDB instance and table mapped by the threadClient and installs it as rowData

    This is a shortcut method, you can just as easily send the rowData in on instantiation
    if you already have it.

    this returns self so it can be chained with the constructor
    like:
        let tikcket = new noiceARSRow({...}).load('000000000000001');

    note: on a no-match this will reject the promise with string 'no match'
*/
load(entryId){
    let that = this;
    return(new Promise((toot, boot) => {
        that.threadClient.getARSRow({
            schema: that.formName,
            ticket: entryId,
            fields: [],
            returnFormat: 'fieldName'
        }).then((row) => {

            // this oughta work!
            that.rowData = row;

            // toot self for chaining
            toot(that);

        }).catch((error) => {
            if (
                (error instanceof Object) &&
                (error.hasOwnProperty('messageNumber')) &&
                parseInt(error.messageNumber) == 404
            ){
                that.log(`load(${entryId}) | threadClient.getARSRow() | no match`, true);
                boot('no match')
            }else{
                that.log(`load(${entryId}) | threadClient.getARSRow() threw unexpectedly: ${error}`);
                boot(error);
            }
        })
    }));
}




/*
    saveCallback(rowData, selfRef)
*/
saveCallback(rowData, selfRef){
    let that = this;
    return(new Promise((toot, boot) => {

        // munge changedFields into the input modifyInputRow needs
        let fieldsToWrite = that.changedFields;
        Object.keys(fieldsToWrite).forEach((fieldName) => {
            let value = fieldsToWrite[fieldName].value;
            delete(fieldsToWrite[fieldName]);
            fieldsToWrite[fieldName] = value;
         });

        // tell the threadClient to write it!
        that.threadClient.modifyARSRow({
            schema: that.formName,
            ticket: that.entryId,
            fields: fieldsToWrite
        }).then((r) => {
            that.log(`saveCallback(${that.entryId}) | success`, true);
            toot(true);
        }).catch((error) => {
            that.log(`saveCallback(${that.entryId}) | threadClient.modifyARSRow() threw unexpectedly: ${error}`);
            boot(error);
        });

    }));
}




}
export { noiceARSRow };
