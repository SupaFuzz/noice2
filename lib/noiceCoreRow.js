/*
    noiceCoreRow.js
    Amy Hicox <amy@hicox.com> 4/1/24

    this models a collection of noiceCoreValue elements related by the fact that they
    all belong to the same record. Where noiceCoreValue objects  might abstract "columns",
    nocieCoreRow objects abstracts a row.

    attributes:

        * changeFlag                <bool> default: false
        * changeFlagCallback        <function(n,o,s){...}>
        * dataElements              <obj> default: {} | { <fieldID>: <noiceCoreValue>, ...}
        * hasDataElements           <bool> default: false | true if at least once noiceCoreValue is instantiated in .dataElements
        * rowData                   <obj> default: {} | { <fieldID>:<value>, ... } - note: setting this wipes out and reinstantiates all the dataElements
        * logCallback               <function(str)>
        * saveCallback              <function(this.rowData)>
        * validationErrors          <obj { <fieldID>:[{validationError}, ...]}
        * validationWarnings        <obj { <fieldID>:[{validationWarning}, ...]}
        * hasErrors                 <bool> default: false
        * hasWarnings               <bool> default: false

    functions:
        * log(str, debugModeLogBool) -      will failover to console.log if not logCallback is specified
        * save(forceBool) -                 awaits validdate(), aborts if validationErrors unless forceBool set, calls saveCallback(), resets changeFlags and validations
        * validate() -                      executes validate against all fields in .dataElements, returns or of all hasErrors from all fields
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
        _hasErrors: false,
        _validationErrors: {},
        _hasWarnings: false,
        _validationWarnings: {},
        _hasDataElements: false,
        _changeFlag: false,
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
                validateOnChange: true,
                fieldID: colName,
                defaultValue: v[colName],
                valueChangeCallback: async(n,o,s) => { return(that.valueChange({ fieldID: colName, newValue: n, oldValue: o, fieldReference: s })); },
                valueChangedCallback: async(n,o,s) => { return(that.valueChangePostHook({ fieldID: colName, newValue: n, oldValue: o, fieldReference: s })); },
                validationStateChangeCallback: (e, w, errs, s) => { that.fieldValidationStateChange({ fieldID: colName, hasErrors: e, hasWarnings: w, errors: errs, fieldReference: s })},
                editableStateChangeCallback: (t,f,s) => { that.fieldEditableStateChange({fieldID: colName, editable: t, oldEditable: f, fieldReference: s}) },
                nullableStateChangeCallback: (t,f,s) => { that.fieldNullableStateChange({fieldID: colName, editable: t, oldEditable: f, fieldReference: s}) },
                changeFlagCallback: (n, o, s) => { that.fieldChangeFlagToggle({fieldID: colName, changeFlag: n, oldChangeFlag: o, fieldReference: s}); },
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

    LOH 4/2/24 @ 2115 -- COB (extended)
    added save(), validate() and associated attributes
    might be getting close to done enough for a base class to start building
    ars-specific stuffs on it.

    acutually yeah. If i'm feelin frisky I might come through and synctax/test
    yet this evening. Else for tomorrow, then wrap up the base class and get
    cookin on the extensions
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
    save(forceBool)
    await saveCallback() if we have one, then reset the changeFlag on all the fields
    no need to actually blow away undoValues I don't suppose.
*/
save(forceBool){
    let that = this;
    return(new Promise((toot, boot) => {

        // validation stuff
        new Promise((_t,_b) => { _t((forceBool === true)?true:that.validate()) }).then((recordIsOK) => {
            if (recordIsOK){

                // await saveCallback if we got one
                new Promise((_t,_b) =>{ _t((that.saveCallback instanceof Function)?that.saveCallback(that.rowData, that):false); }).then(() => {

                    // reset change flags
                    Object.keys(that.dataElements).filter((a)=>{return(that.dataElements[a].changeFlag)}).map((a)=>{return(that.dataElements[a])}).forEach((field) => {
                        field.changeFlag = false;
                    });
                    that.changeFlag = false;

                    // if we were in force mode, reset validation errors as well
                    if (forceBool === true){
                        Object.keys(that.dataElements).filter((a)=>{return(that.dataElements[a].errors.length > 0)}).map((a)=>{return(that.dataElements[a])}).forEach((field) => {
                            field.clearValidationErrors();
                            field.clearValidationWarnings();
                        });
                    }

                    // all done!
                    toot(true);

                }).catch((error) => {
                    // saveCallback threw
                    that.log(`save(${forceBool}) | saveCallback() threw unexpectedly: ${error}`);
                    boot(error);
                });

            }else{
                // abort for validation errorrs
                that.log(`save(${forceBool}) | validation errors prevent save`, true);
                boot('validation errors prevent save');
            }

        }).catch((error) => {

            // validate() threw
            // NOTE: this is a legit error, not a validation error
            that.log(`save(${forceBool}) | validate() threw unexpectedly: ${error}`);
            boot(error);
        });
    }));
}




/*
    validate()
    execute validate() on all of the fields in dataElements
    resolve to a bool. true if no validation errors, else false
*/
validate(){
    let that = this;
    return(new Promise((toot, boot) => {
        Promise.all(Object.keys(that.dataElements).map((fieldID) => { return(that.dataElements[fieldID].validate()); })).then(() => {
            toot(Object.keys(that.dataElements).filter((fieldID) => {return(that.dataElements[fieldID].hasErrors)}) > 0);
        }).catch((error) => {
            that.log(`validate() | at least one field validate() call threw (see log) | ${error}`);
            boot(error);
        });
    }));
}








/*
    --------------------------------------------------------------------------------
    ATTRIBUTES
    --------------------------------------------------------------------------------
*/



// changeFlag
get changeFlag(){
    return((Object.keys(this.dataElements).filter((a)=>{return(a.changeFlag)})) > 0);
}
set changeFlag(v){
    let to = (v === true);
    if ((this._changeFlag != to) && (this.changeFlagCallback instanceof Function)){
        this.changeFlagCallback(to, this._changeFlag, this);
    }
    this._changeFlag = to;
}




// validationErrors
get validationErrors(){
    let that = this;
    let out = {};
    Object.keys(that.dataElements).filter((fieldID) => {return(that.dataElements[fieldID].hasErrors)}).forEach((fieldID) => {
        out[fieldID] = that.dataElements[fieldID].errors.filter((a) => {return(a.severity == "error")});
    });
    return(out);
}




// validationWarnings
get validationWarnings(){
    let that = this;
    let out = {};
    Object.keys(that.dataElements).filter((fieldID) => {return(that.dataElements[fieldID].hasWarnings)}).forEach((fieldID) => {
        out[fieldID] = that.dataElements[fieldID].errors.filter((a) => {return(a.severity == "warning")});
    });
    return(out);
}




// hasErrors
get hasErrors(){
    return(Object.keys(this.dataElements).filter((fieldID) => {return(this.dataElements[fieldID].hasErrors)}, this).length > 0);
}




// hasWarnings
get hasErrors(){
    return(Object.keys(this.dataElements).filter((fieldID) => {return(this.dataElements[fieldID].hasWarnings)}, this).length > 0);
}








/*
    --------------------------------------------------------------------------------
    FIELD CALLBACKS
    these functions are executed as callbacks on the fields in this.dataElements
    --------------------------------------------------------------------------------
*/




/*
    fieldChangeFlagToggle({fieldID: <colName>, changeFlag: <bool>, oldChangeFlag: <bool>, fieldReference: <noiceCoreValue>})
    the changeFlag has been *potentially* affected in a field in this.dataElements -= to be sure, check old != new values
    also update this.changeFlag from here, which allows the this.changeFlagCallback to do it's thing.
    UI subclasses may want to inject something here for updating changed field visual status
*/
fieldChangeFlagToggle(args){
    let that = this;
    if (args.changeFlag != args.oldChangeFlag){
        let otherChangeFlags = (Object.keys(that.dataElements).filter((a)=>{return( (a.fieldID != args.fieldID) && a.changeFlag )}).length > 0);
        that.changeFlag = (args.changeFlag || otherChangeFlags);
    }
}




/*
    fieldNullableStateChange({ fieldID: <colName>, editable: <bool>, oldEditable: <bool>, fieldReference: <noiceCoreValue>})
    this is just a UI hook for toggling nullable visually
    actually maybe this doesn't even belong here and we ought to inject this from
    a ui subclass. I dunno. placeholder for now.
*/
fieldNullableStateChange(args){
    // placeholder
    return(true);
}




/*
    fieldEditableStateChange({ fieldID: <colName>, editable: <bool>, oldEditable: <bool>})
    this is also just a UI hook -- this one for lock/unlocking fields visually
*/
fieldEditableStateChange(args){
    // placeholder
    return(true);
}




/*
    fieldValidationStateChange({ fieldID: <colName>, hasErrors: <bool>, hasWarnings: <bool>, errors: <array>, fieldReference: <noiceCoreValue Object> }
    a field's validation state has changed
    I suppose you could hang something off here to update *this* object's .hasErrors bool or what have you.
    but really this is also a UI hook for toggling validation error indicators and whatnot
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
