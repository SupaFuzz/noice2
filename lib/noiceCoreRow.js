/*
    noiceCoreRow.js
    Amy Hicox <amy@hicox.com> 4/1/24

    this models a collection of noiceCoreValue elements related by the fact that they
    all belong to the same record. Where noiceCoreValue objects  might abstract "columns",
    nocieCoreRow objects abstracts a row.

    attributes:

        we gonna mess around and come back on the docs
        gotta play with this a little bit

*/
import { noiceObjectCore, noiceException, noiceCoreChildClass } from './noiceCore.js';
import { noiceCoreValue } from './noiceCoreValue.js';
class noiceCoreRow extends noiceCoreChildClass {




/*
    constructor({

    })
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version: 1,
        _className: 'noiceCoreRow',
        _rowData:   {},
        _dataElements: {},
        _hasDataElements: false
    },defaults),callback);

    // do init stuffs here, yo!

}



// hasDataElements (bool / read-only) -- true if we have as many dataElements as we do rowData keys
get hasDataElements(){
    let da = this.dataElements;
    return(
        Object.keys(da).filter((a) =>{ return(da[a] instanceof noiceCoreValue) }).length ==
        Object.keys(da).length
    );
}

// dataElements (object / read-only) -- { <fieldName>: <noiceCoreValue Object>, ... }
get dataElements(){ return(this._dataElements); }
set dataElements(v){ if (v instanceof Object){ this._dataElements = v;} }

// rowData - read-write -- { <fieldName>: <value>, ... }
get rowData(){
    let that = this;
    if (that.hasDataElements){
        let tmp = {};
        Object.keys(that.dataElements).forEach((o) =>{ tmp[o] = that.dataElements[o].value; });
        return(tmp);
    }else{
        return(that._rowData);
    }
}
set rowData(v){
    let that = this;

    // NOTE: this resets *everything* just so you know lol

    if (v instanceof Object){
        that._rowData = {};
        that.dataElements = {};
        Object.keys(v).forEach((colName) => {
            that.dataElements[colName] = new noiceCoreValue({
                editable: true,
                fieldID: colName,
                defaultValue: v[colName],
                valueChangeCallback: async(n,o,s) => { return(that.valueChange({ fieldID: colName, newValue: n, oldValue: o, fieldReference: s })); },
                valueChangedCallback: async(n,o,s) => { return(that.valueChangePostHook({ fieldID: colName, newValue: n, oldValue: o, fieldReference: s })); },
                validationStateChangeCallback: (e, w, errs, s) => { that.fieldValidationStateChange({ fieldID: colName, hasErrors: e, hasWarnings: w, errors: errs, fieldReference: s })},
                editableStateChangeCallback: (t,f,s) => { that.fieldEditableStateChange({fieldID: colName, editable: t, oldEditable: f, fieldReference: s}) },
                nullableStateChangeCallback: (t,f,s) => { that.fieldNullableStateChange({fieldID: colName, editable: t, oldEditable: f, fieldReference: s}) },
                changeFlagCallback: (n, o, s) => { that.changeFlagHandler({fieldID: colName, changeFlag: n, oldChangeFlag: o, fieldReference: s}); },
                logCallback: this.log
            });
        })
    }
}




/*
    LOH 4/1/24 @ 1719 -- COB
    this is a good start. remember we're working toward a totally agnostic base class
    that we can extend later

    we need a fieldDefinitions input or something like that
    this gives field prototypes, limits, types other stuff .. in set rowData, we'll
    match fields up by name and instantiate them with appropriate validators and such

    once we've got that far, extend it again, and translate an ARS form definition
    into a fieldDefinitions object on instantiation, with an arsSyncWorkerClient
    object in tow too so we can call it on save ops

    we need a toggle attrihbute to enable save-on-change -- saveOnChange (bool)
    you know what I'm saying.

    once we've got that completed, then start hacking on a UI layer

    UPDATE 4/1/24 @ 2136
    fixed existing code and cursory tested. What's here seems to work but
    next step hook up some debug statements in the callbacks and see how that
    goes. Otherwise still on the tip above

*/



/*
    log(str, debugOnlyBool)
    log a string, either to console.log or to .logCallback if specified
    if debugOnlyBool is set true, only execute log if this.debug == true
*/
log(str, debugOnlyBool){
    if ((debugOnlyBool !== true) || ((this.debug === true) && (debugOnlyBool === true))){
        let logger = (this.logCallback instanceof Function)?this.logCallback:console.log;
        logger(`${this._className} v${this._version} | ${str}`);
    }
}




/*
    fieldNullableStateChange({ fieldID: <colName>, editable: <bool>, oldEditable: <bool>})
*/
fieldNullableStateChange(args){
    // placeholder
    return(true);
}



/*
    fieldEditableStateChange({ fieldID: <colName>, editable: <bool>, oldEditable: <bool>})
*/
fieldEditableStateChange(args){
    // placeholder
    return(true);
}



/*
    fieldValidationStateChange({ fieldID: <colName>, hasErrors: <bool>, hasWarnings: <bool>, errors: <array>, fieldReference: <noiceCoreValue Object> }
    a field's validation state has changed
*/
fieldValidationStateChange(args){
    // placeholder
    return(true);
}



/*
    valueChange({ fieldID: <colName>, newValue: <val>, oldValue: <val>, fieldReference: <noiceCoreValue object> })
*/
valueChange(args){
    return(new Promise((toot, boot) => {
        // place holder
        toot(args.newValue);
    }));
}




/*
    valueChangePostHook({ fieldID: <colName>, newValue: <val>, oldValue: <val>, fieldReference: <noiceCoreValue object> })
    exactly like valueChange, except that the resolution or fulfillment status of this function affects nothing and
    it is executed *after* the field value change has been committed to the field -- use this to drive consequence free
    stuff like UI indicators. Use valueChange to control value change flow and await commits, etc.
*/
valueChangePostHook(args){
    return(new Promise((toot, boot) => {
        // place holder
        toot(args.newValue);
    }));
}


}
export { noiceCoreRow };
