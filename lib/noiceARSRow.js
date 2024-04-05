/*
    noiceARSRow.js
    Amy Hicox <amy@hicox.com> 4/3/24

    this extends the noiceCoreRow class for integration to rows on indexedDB datastores
    managed by a noiceARSSyncWorker

    ATTRIBUTES
        * formName                              <str> default: null, required
        * threadClient                          <noiceARSSyncWorkerClient> default: null, required
        * auxFieldConfig                        <object {<fieldID>:{configOptions}, ...}
        * mode                                  <enum [modify|create]> default: modify
        * modeChangeCallback                    <function(mode, oldMode, selfRef)>
        * entryId                               <str> - gets the value of whatever field is #1 in the rowData or null
        * dataLoadedCallback(this.rowData)      <async function()> - use for setting up UI. we'll await the output of this if specified on load() and refresh()

    FUNCTIONS
        * initFormFields()                      called from constructor, fetches ars formDef from threadClient,
                                                mangles it and installs it as the fieldConfig
        * getFieldByID(fieldID)                 returns the dataElement matching 'fieldID' or null
        * getFieldByName(fieldName)             same deal, gimme the dataElement matching 'fieldName' or null
        * async load(entryId)                   pull the row identified by entryId from this.formName and install it as rowData (setting up dataElements, etc)
        * async refresh(mergeChanges)           pull data from this.entryId and this.FormName and update dataElement values. if mergeChanges is set true, don't update dataElements where changeFlag = true

    TO-DO
        * on 'mode' change, update props on dataElements from aux config if mode specific configs exist
        * on instantiate where mode:create, we need to spawn dataElements or something ... mode specific config?
        * grr -- update() might need to spawn new dataElements
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
            messageNumber: 1,
            message: 'threadClient is not instance of noiceARSSyncWorkerClient',
            thrownBy: `noiceARSRow constructor()`
        }));
    }
    if (! this.isNotNull(this.formName)){
        throw(new noiceException({
            messageNumber: 2,
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
            messageNumber: 3,
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
            messageNumber: 4,
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
    let b = Object.keys(this.dataElements).filter((fieldName) => {return(parseInt(this.dataElements[fieldName].id) == 1)}, this);
    return((b.length > 0)?this.dataElements[b[0]].value:null);
}
set entryId(v){
    if (this.isNotNull(v)){
        let entryIdDataElement = this.getFieldByID(1);
        if (this.isNotNull(entryIdDataElement)){
            entryIdDataElement.value = v;
        }else{
            this.getDataElement(this.getFieldNameByID(1), v);
        }
    }
}




/*
    getFieldByID(fieldID)
    returns the dataElement matching 'fieldID' or null
*/
getFieldByID(fieldID){
    let b = (! isNaN(parseInt(fieldID)))?Object.keys(this.dataElements).filter((fieldName) => {return(parseInt(this.dataElements[fieldName].id) == parseInt(fieldID))}, this):[];
    return((b.length > 0)?this.dataElements[b[0]]:null);
}




/*
    getFieldByName(fieldName)
    same deal, gimme the dataElement matching 'fieldName' or null
*/
getFieldByName(fieldName){
    let b = this.isNotNull(fieldName)?Object.keys(this.dataElements).filter((fn) => {return(fn == fieldName)}, this):[];
    return((b.length > 0)?this.dataElements[b[0]]:null);
}




/*
    getFieldNameByID(fieldID)
    return the name of the field idenfied by fieldID
*/
getFieldNameByID(fieldID){
    let b = Object.keys(this.fieldConfig).filter((fieldName) => {return( (! isNaN(parseInt(fieldID))) && (parseInt(this.fieldConfig[fieldName].id) == parseInt(fieldID)) )}, this);
    return((b.length > 0)?b[0].fieldName:null)
}




/*
    getFieldIDByName(fieldName)
    return the name of the field idenfied by fieldID
*/
getFieldIDByName(fieldName){
    let b = Object.keys(this.fieldConfig).filter((fn) => {return( this.isNotNull(fieldName) && (fieldName == fn) )}, this);
    return((b.length > 0)?b[0].id:null)
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
            fieldName: fieldName,
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

            // await dataLoadedCallback if we've got one
            new Promise((_t) => {_t((that.dataLoadedCallback instanceof Function)?that.dataLoadedCallback(that.rowData):false)}).then(() => {
                // toot self for chaining
                toot(that);
            }).catch((error) => {
                that.log(`load(${entryId}) | successfully updated dataElements | dataLoadedCallback() threw unexpectedly: ${error}`);
                boot(error);
            });

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
    refresh(mergeChanges)
    if mode:modify, pull all of the data from the dbRecord identified by this.entryId
    and update all of the fields and *do not* set change flags true while doing so
    as these represent the current state of the obect in the db

    if mergeChanges is set true, do not update the value of fields with the changeFlag active
    simply update the values of fields where changeFlag is false

    if refreshCallback is specified,  call this *after* updating row values
*/
refresh(mergeChanges){
    let that = this;
    return(new Promise((toot, boot) => {
        if ((that.mode == "modify") && that.isNotNull(that.entryId) && that.isNotNull(that.formName)){
            that.threadClient.getARSRow({
                schema: that.formName,
                ticket: that.entryId,
                fields: [],
                returnFormat: 'fieldName'
            }).then((row) => {
                Promise.all(Object.keys(row).filter((fieldID) => {return(
                    (! (that.dataElements.hasOwnProperty(fieldID))) ||
                    (! (mergeChanges === true)) ||
                    ((mergeChanges === true) && (!(that.dataElements[fieldName].changeFlag)))
                )}).map((fieldID) => { return(that.getDataElement(fieldID, row[fieldID])); })).then(() => {

                    // now we gotta prune dataElements that no longer exist in the row
                    Promise.all(Object.keys(that.dataElements).filter((fieldID) =>{ return((!(row.hasOwnProperty(fieldID)))); }).map((fieldID) => {return(
                        that.removeDataElement(fieldID)
                    )})).then(() => {
                        that.log(`refresh(${that.entryId}) | successfully updated dataElements`, true);

                        // await dataLoadedCallback if we've got one
                        new Promise((_t) => {_t((that.dataLoadedCallback instanceof Function)?that.dataLoadedCallback(that.rowData):false)}).then(() => {
                            toot(that.rowData);
                        }).catch((error) => {
                            that.log(`refresh(${that.entryId}) | successfully updated dataElements | dataLoadedCallback() threw unexpectedly: ${error}`);
                            boot(error);
                        });

                    }).catch((error) => {
                        // pruning data elements failed? shouldn't actually be possible but I'm feelin pedantic
                        that.log(`refresh(${that.entryId}) | at least one dataElement.removeDataElement() calls threw unexpectedly (see log): ${error}`);
                        boot(error);
                    });
                }).catch((error) => {
                    that.log(`refresh(${that.entryId}) | at least one getDataElement() calls threw unexpectedly (see log): ${error}`);
                    boot(error);
                });
            }).catch((error) => {
                that.log(`refresh(${that.entryId}) | threadClient.getARSRow() threw unexpectedly: ${error}`);
                boot(error);
            });
        }else{
            let errstr = `mode is not "modify" or entryId is null or formName is null`;
            that.log(`refresh() | ${errstr}`, true);
            boot(errstr);
        }
    }));
}




/*
    saveCallback(rowData, selfRef)
    ask the threadClient to save or create the thing, then refresh it from the db
    because the threadClient mighta had filters that mutate the record on save
*/
saveCallback(rowData, selfRef){
    let that = this;
    return(new Promise((toot, boot) => {

        // await the create or update ..
        new Promise((_t, _b) => {
            switch (that.mode){

                // create mode
                case 'create':
                    that.threadClient.createARSRow({
                        schema: that.formName,
                        fields: that.rowData
                    }).then((entryId) => {

                        // note: threadClient.createARSRow will have generated a GUID for us if we didn't supply one on rowData
                        this.entryId = entryId;
                        this.mode = "modify";
                        _t(entryId);

                    }).catch((error) => {
                        // createARSRow threw
                        that.log(`saveCallback() | mode: create | threadClient.createARSRow() threw unexpectedly: ${error}`);
                        _b(error);
                    });
                break;

                // modify mode
                case 'modify':
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
                        that.log(`saveCallback(${that.entryId}) | mode: modify | success`, true);
                        _t(that.entryId);
                    }).catch((error) => {
                        that.log(`saveCallback(${that.entryId}) | mode: modify | threadClient.modifyARSRow() threw unexpectedly: ${error}`);
                        _b(error);
                    });
                break;
            }

        }).then(() => {

            // refreshments!
            that.refresh().then((rowData) => {
                toot(true);
            }).catch((error) =>{
                // refresh threw
                that.log(`saveCallback(${that.entryId}) | mode: ${this.mode} | post-save refresh() threw unexpectedly: ${error}`);
                boot(error);
            });

        }).catch((error) => {
            // create or upate failed
            that.log(`saveCallback(${that.entryId}) | mode: ${this.mode} | create or modify transaction threw threw unexpectedly (see log): ${error}`);
            boot(error);
        });
    }));
}






}
export { noiceARSRow };
