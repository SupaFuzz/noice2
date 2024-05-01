/*
    wcARSFormView.js
    4/23/24     Amy Hicox <amy@hicox.com>

    events:
    * field_value_change { name: formElement.name, value: formElement.value, formElement: formElement, self: this }
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { wcFormElement } from './wcFormElement.js';
wcFormElement.registerElement('wc-form-element');

class wcARSFormView extends noiceAutonomousCustomElement {


static classID = wcARSFormView;
static classAttributeDefaults = {
    entry_id: { observed: true, accessor: true, type: 'str', value: '', forceAttribute: true },
    mode: { observed: true, accessor: true, type: 'enum', values: ['create', 'modify'], value: 'create', forceAttribute: true },
    disabled: { observed: true, accessor: true, type: 'bool', value: false },
    db_sync: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    change_flag: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    height: { observed: true, accessor: true, type: 'str', value: '100vh' },
    align_labels: { observed: true, accessor: true, type: 'bool', value: true },

    // I'm sure I'll think of more
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(args){
    super(args);
    this._className = 'wcARSFormView';
    this._version = 1;
    this._elements = {};
    this.formElements = {};
    this._rowData = {};
    this.logger = ((args instanceof Object) && (args.logger instanceof Function))?args.logger:console.log;

    /*
        come back here and do the throw if we don't got 'em after we figure the rest out

        things we need to instantiate
        .rowData = { fieldName: value, ... }
        .fieldConfig = { fieldName: { id: <int>, name: <str>, type: <enum>, values: [ ... ],  modes: { ... }}}

        you can use also to set indiviual field values
        .setFieldValue(name, value)

        remember -- the arsRow *owns* the wcARSFormView not the other way round
        when a field changes value it gets the valueChangeCallback(), which should be bound already to the arsRow dataElement

        setting .fieldConfig should call renderFieldContainer() again.

        also .mode that's required too or needs to default?

    */

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        // (n)ame, (o)ldValue, (v)alue, (s)elf -- you're welcome :-)
        height: (n, o, v, s) => { s.setHeight(v, o); },
        align_labels: (n, o, v, s) => { s.alignLabels(v); },
        change_flag: (n, o, v, s) => { s.setChangeFlag(v); },
        disabled: (n, o, v, s) => { s.toggleDisabled(v, o); },
        mode: (n, o, v, s) => { s.changeMode(v, o); },
    };
}




/*
    getAttributeDefaults()
*/
getAttributeDefaults(){
    return(wcARSFormView.classAttributeDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){
    let div = document.createElement('div');
    div.style.height = this.height;
    div.className = this._className;

    /*
        insert shenanigans here
        thinking something like ...

        --------------------------------------------------
        | <entry_id>    | <mode> | <btnSave> | <db_sync> |
        --------------------------------------------------
        |                                                |
        | <field container>                              |

        we're gonna need to figure out how we want to deal with entry_id change
        and loading, etc. Also how to handle create mode.

        if this is born from markup it won't have a reference to .rowData and .fieldConfig as input
        and hence we won't know what fields to draw. So I think we'll have to render
        with a null field container, then update as we get input
    */
    div.insertAdjacentHTML('afterbegin', `
        <div class="header" data-sync="${this.db_sync}">
            <div class="recordIdentification">
                <span class="textField" data-name="entryId">${this.isNull(this.entry_id)?this.entryId:this.entry_id}</span>
                <span class="textField" data-name="mode">(${this.mode})</span>
            </div>
            <div class="buttonContainer">
                <button class="btnClose"></button>
                <button class="btnSave">${(this.mode == "create")?'create':'save'}</button>
            </div>
        </div>
        <div class="fieldContainer"></fieldContainer>
    `);

    // element references
    this._elements.fieldContainer = div.querySelector('div.fieldContainer');
    this._elements.entryId = div.querySelector('span.textField[data-name="entryId"]');
    this._elements.mode = div.querySelector('span.textField[data-name="mode"]');
    this._elements.btnSave = div.querySelector('button.btnSave');
    this._elements.btnClose = div.querySelector('button.btnClose');

    // render the formElements for this mode
    this.renderFieldContainer(this._elements.fieldContainer);

    // clickHandlers
    let that = this;
    that._elements.btnClose.addEventListener('click', (evt) => { that.close(); })

    return(div);
}




/*
    arsTypeToFormElementType(arsType)
    return the wcFormElement.type value corresponding to the
    arsConfig.type. This is a simple string converter
*/
arsTypeToFormElementType(arsType){
    const arsTypeMapping = {
        'CHAR':         'text',
        'ENUM':         'select',
        'TIME':         'datetime-local',
        'DATE':         'date',
        'DECIMAL':      'number',
        'INTEGER':      'number',
        'TIME_OF_DAY':  'time',
        'CURRENCY':     'text',

        // this is a manual override to get textareas
        'textarea':     'textarea'

        /*
            unsupported remedy datatypes we'll deal with later

            ENUM has subtypes -- for now, all enum's are selects
            checkbox -> type: 'ENUM', display_properties[0].DATA_RADIO = 2
            radio    -> type: 'ENUM', display_properties[0].DATA_RADIO = 1

            DIARY and REAL -- gonna need wcFormElement extension classes
            'REAL':         ?
            'DIARY':        ?,

            may wanna make a 'CURRENCY' type extension field as well depending.
        */
    };
    return((arsTypeMapping.hasOwnProperty(arsType))?arsTypeMapping[arsType]:null);
}




/*
    getFormElement(fieldConfigEntry)
*/
getFormElement(fieldConfigEntry){
    let that = this;
    if (! this.formElements.hasOwnProperty(fieldConfigEntry.fieldName)){

        this.formElements[fieldConfigEntry.fieldName] = new wcFormElement(Object.assign(
            {
                capture_value_on: 'focusoutOrReturn',
            },
            fieldConfigEntry,
            ((fieldConfigEntry.modes instanceof Object) && (fieldConfigEntry.modes[this.mode] instanceof Object))?fieldConfigEntry.modes[this.mode]:{},
            {
                type: this.arsTypeToFormElementType(fieldConfigEntry.type),
                captureValueCallback: (val, s) => { that.fieldValueChange(val, s); },
                undoCallback: (s, btn) => { that.fieldUndo(s, btn) },
                menuCallback: (s, btn) => { that.fieldMenu(s, btn) },
                default_value: this.rowData.hasOwnProperty(fieldConfigEntry.fieldName)?this.rowData[fieldConfigEntry.fieldName]:null,
                name: fieldConfigEntry.fieldName
            }
        ));
    }
    return(this.formElements[fieldConfigEntry.fieldName]);
}




/*
    log()
    may expand this at some point, but this.logger controls where it goes
*/
log(str){
    this.logger(`${this._className} v${this._version} | ${str}`);
}




/*
    manageFormElements()

    this instantiates wcFormElement objects correlating to fields on this.fieldConfig
    where:
        this.fieldConfig[<fieldName>].modes[this.mode].display == true

    for each field matching this condition, if it does not exist, will be instantited.
    for each pre-existing field that does not exist in the config with this condition will be removed

    output is on this.formElements[fieldName]
*/
manageFormElements(){
    if ( (this.fieldConfig instanceof Object) ){

        // make anything missing
        Object.keys(this.fieldConfig).filter((fieldName) =>{return(
            (! this.formElements.hasOwnProperty(fieldName)) &&
            (this.fieldConfig[fieldName] instanceof Object) &&
            (this.fieldConfig[fieldName].modes instanceof Object) &&
            (this.fieldConfig[fieldName].modes[this.mode] instanceof Object) &&
            this.fieldConfig[fieldName].modes[this.mode].hasOwnProperty('display') &&
            (this.fieldConfig[fieldName].modes[this.mode].display === true)
        )}, this).forEach((fieldName) => { this.formElements[fieldName] = this.getFormElement(this.fieldConfig[fieldName])}, this);

        // prune anything removed
        Object.keys(this.formElements).filter((fieldName) => {return(!(
            (this.fieldConfig[fieldName] instanceof Object) &&
            (this.fieldConfig[fieldName].modes instanceof Object) &&
            (this.fieldConfig[fieldName].modes[this.mode] instanceof Object) &&
            this.fieldConfig[fieldName].modes[this.mode].hasOwnProperty('display') &&
            (this.fieldConfig[fieldName].modes[this.mode].display === true)
        ))}, this).forEach((fieldName) => {
            this.formElements[fieldName].remove();
            delete(this.formElements[fieldName]);
        }, this);

    }else{
        if (this.debug){ this.log(`${this._className} v${this._version} | manageFormElements() called with no fieldConfig`); }
    }
}




/*
    renderFieldContainer(fieldContainerElement)
    resets fieldContainer innerHTML to null
    spews the contents of this.formElements into fieldContainer
    with associated markup etc to render how you want the fields displayed
    you might want to override this in subclasses to customise display modes
    etc. ye verily.
*/
renderFieldContainer(fieldContainerElement){
    this.manageFormElements();

    /*
        TO-DO: insert shenanigans here
    */
    fieldContainerElement.innerHTML = '';

    /*
        this should get moved to a sublcass like wcNSCANFormView or something
        for the moment hard coding it because we have so much else left to work
        on here before we get to subclasses. But when we do move this to the
        new child class and then uncomment the dumb demo one below
    */
    ['shipping', 'receiving', 'tags and identification', 'location and assignment', 'item information' ,'etc.'].forEach((sectionTitle) => {
        let fs = document.createElement('fieldset');
        fs.dataset.name = sectionTitle;
        let legend = document.createElement('legend');
        legend.textContent = sectionTitle;
        fs.appendChild(legend);
        Object.keys(this.fieldConfig).map((a)=>{return(this.fieldConfig[a])}, this).filter((conf) => {return(
            (conf instanceof Object) &&
            (conf.hasOwnProperty('displaySection')) &&
            (conf.displaySection == sectionTitle) &&
            (conf.hasOwnProperty('displayOrder')) &&
            (! isNaN(parseFloat(conf.displayOrder))) &&
            this.formElements.hasOwnProperty(conf.fieldName)
        )}, this).sort((a,b) => {return(a.displayOrder - b.displayOrder)}).forEach((conf) => {
            fs.appendChild(this.formElements[conf.fieldName]);
        })
        fieldContainerElement.appendChild(fs);
    });



    /*
        this is a braindead rendr the fields in alphabetical order demo
        this should be the class default.

        Object.keys(this.formElements).sort().forEach((fieldName) => {
            fieldContainerElement.appendChild(this.formElements[fieldName]);
        }, this);
    */
}




/*
    entryId getter returns the value of fieldID = 1 (or null)
*/
get entryId(){
    return(
        (
            (this.fieldConfig instanceof Object) &&
            (Object.keys(this.fieldConfig).filter((fieldName) => { return(this.fieldConfig[fieldName].id == 1) }, this).length > 0) &&
            (this.rowData instanceof Object) &&
            this.rowData.hasOwnProperty(Object.keys(this.fieldConfig).filter((fieldName) => { return(this.fieldConfig[fieldName].id == 1) }, this)[0])
        )?this.rowData[Object.keys(this.fieldConfig).filter((fieldName) => { return(this.fieldConfig[fieldName].id == 1) }, this)[0]]:null
    )
}




/*
    defaultStyle attribute getter
*/
get defaultStyle(){
    /*
        put the internal stylesheet here
    */
    return(
`:host {
    display: block;
}
div.wcARSFormView {
    display: grid;
    grid-template-rows: auto auto;
    align-content: baseline;
    overflow: hidden;
    box-sizing: border-box;
    background-color: var(--wc-formview-background);
}
.header {
    width: 100%;
    height: min-content;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    background: var(--wc-formview-header-background);
    background-color: var(--wc-formview-header-background-color);
    font-family: var(--wc-formview-control-font);
    border-bottom: var(--wc-formview-header-border-bottom);
    margin-bottom: .5em;
}
.header .recordIdentification {
    padding-left: .5em;
}
.header .buttonContainer {
    display: flex;
    flex-direction: row-reverse;
    align-items:  center;
    padding: .5em;
}
.header .buttonContainer button {
    font-size: 1em;
    margin: .25em;
    border-radius: .66em;
    font-family: var(--wc-formview-control-font);
}
.header .buttonContainer button.btnSave:disabled {
    background-color: transparent;
    color: var(--wc-formview-btnsave-disabled-color);
    border-color: var(--wc-formview-btnsave-disabled-border-color);
    opacity: .5;
}
.header .buttonContainer button.btnSave {
    color: var(--wc-formview-btnsave-color);
    background-color: var(--wc-formview-btnsave-background);
    border: var(--wc-formview-btnsave-border);
    padding: var(--wc-formview-btnsave-padding);
}
.header .buttonContainer button.btnClose {
    width: 1.5em;
    height: 1.5em;
    border: none;
    border-radius: 0;
    background: var(--theme-cancel-icon-light-gfx);
    background-size: contain;
    background-repeat: no-repeat;
}
.fieldContainer {
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    display: grid;
    justify-content: left;
    padding-right: 2em;
}
.fieldContainer fieldset {
    margin: .5em;
    border-left: none;
    border-right: none;
    border-bottom: none;
    border-top: var(--wc-formview-header-border-bottom);
}
.fieldContainer legend {
    color: var(--wc-formview-legend-color);
    padding: var(--wc-formview-legend-padding);
}
.fieldContainer fieldset wc-form-element {
    margin-bottom: .5em;
}`
    );
}




/*
    setHeight(v)
*/
setHeight(v){
    if (this.initialized){
        this.DOMElement.style.height = `${v}`;
    }
}




/*
    alignLabels(bool)
    that fancy style lol
*/
alignLabels(boo){
    if (this.initialized){

        if (boo === true){
            // get the field with the longest label
            let maxLabel = Object.keys(this.formElements).map((a)=>{return(this.formElements[a])}, this).sort((a,b)=>{return(b.label.length - a.label.length)})[0]._elements.label;
            let oneEM = parseFloat(getComputedStyle(maxLabel).fontSize);
            let setLength = Math.ceil(maxLabel.getBoundingClientRect().width/oneEM);

            // blow it down to all of em
            Object.keys(this.formElements).map((a)=>{return(this.formElements[a])}, this).forEach((el) => { el.label_width = `${setLength + 1}em`; });
        }else{
            Object.keys(this.formElements).map((a)=>{return(this.formElements[a])}, this).forEach((el) => { el.label_width = 'auto'; });
        }
    }
}




/*
    setChangeFlag(bool, changedFields)
    this sets the change flag true or false
    keep in mind this is the UI layer, literally everything that could
    mutate the change_flag MUST be controlled by a backend.

    this changeFlag is quite dumb. It literally turns the save button on and off
    and that's about all.
*/
setChangeFlag(bool){
    if (this._elements.btnSave instanceof Element){
        this._elements.btnSave.disabled = (! (bool === true));
    }
}




/*
    modifyFieldValue(fieldName, value, captureValueBool)
    if the given fieldName has a correspnding formElement, set the given value on it
    if captureValueBool is set true, execute captureValue() on the wcFormElement object
    after setting the value
*/
modifyFieldValue(fieldName, value, captureValueBool){
    if (this.initialized && (this.formElements[fieldName] instanceof wcFormElement)){
        this.formElements[fieldName].value  = value;
        if (captureValueBool === true){ this.formElements[fieldName].captureValue(); }
    }
}




/*
    toggleDisabled(bool)
    attributeChangeHandler for 'disabled' attribute
    when set true we lock every field, button and control in the web componet
    if not set true, we return each field to it's native config-defined disable state
    or whatever state it had whwn we locked it
*/
toggleDisabled(bool, oldBool){

    // if it's changing
    if ((bool === true) != (oldBool === true)){

        // this is no elegance
        Object.keys(this.formElements).forEach((fieldID) => {
            let formElement = this.formElements[fieldID];
            if (bool === true){

                // if the new state is disabled
                formElement._previous_disabled = formElement.disabled;
                formElement.disabled = true;

            }else{

                // if the new state is enabled
                if (formElement.hasOwnProperty('_previous_disabled')){
                    formElement.disabled = formElement._previous_disabled;
                    delete(formElement._previous_disabled);
                }else if (
                    (this.fieldConfig instanceof Object) &&
                    (this.fieldConfig[fieldID] instanceof Object) &&
                    (this.fieldConfig[fieldID].modes instanceof Object) &&
                    (this.fieldConfig[fieldID].modes[this.mode] instanceof Object) &&
                    this.fieldConfig[fieldID].modes[this.mode].hasOwnProperty('edit')
                ){
                    formElement.disabled = (! (this.fieldConfig[fieldID].modes[this.mode].edit === true));
                }else{
                    formElement.disabled = false;
                }

            }
        }, this);

        // oh yes and also the save button
        if (bool === true){
            this._elements.btnSave._previous_disabled = this._elements.btnSave.disabled;
            this._elements.btnSave.disabled = true;
        }else{
            this._elements.btnSave.disabled = this._elements.btnSave.hasOwnProperty('_previous_disabled')?this._elements.btnSave._previous_disabled:false;
            delete(this._elements.btnSave._previous_disabled);
        }

    }
}




/*
    changeMode(newMode, oldMode)
    the formView mode is changing
*/
changeMode(newMode, oldMode){

    // distribute any mode-specific properties to the formElements should we have them
    Object.keys(this.formElements).filter((fieldName) => {return(
        (this.fieldConfig[fieldName] instanceof Object) &&
        (this.fieldConfig[fieldName].modes instanceof Object) &&
        (this.fieldConfig[fieldName].modes[newMode] instanceof Object)
    )}, this).forEach((fieldName) => {
        Object.keys(this.fieldConfig[fieldName].modes[newMode]).forEach((a) => {
            this.formElements[fieldName][a] = this.fieldConfig[fieldName].modes[newMode][a];
        }, this);
    }, this);
    
}



/*
    --------------------------------------------------------------------------------
    TO-DO Stubs Below
    --------------------------------------------------------------------------------
*/




/*
    close()
    anything that wants to remove the element from the document (perhaps a lose focus or
    someone clicked the close button) should come through here. We're going to check the
    change_flag and pop the "are you sure?" dialog if it's set, then await that output
    before calling the 'close' event. closeCallback attribute setter will be the usual
    setup the listener but don't keep a reference thing.

    in to-do section because embedded dialog isn't a thing yet and change_flag isn't a thing
    yet either. For now it just calls this.remove() lol
*/
close(){

    // total placeholder stuff
    this.remove();

}




/*
    initializedCallback()
*/
initializedCallback(){
    /*
        pretty much setup() as in days of yore
        gets called once the first time the element is appended to something
        *after* initialization and the rest of the guts have fired, so this is
        truly for custom one-off stuff here
    */

    // note this gonna need to get called whenever we add or remove fields
    // putting it at the end of renderFieldContainer() didn't work
    // so basically on mode change I guess
    this.alignLabels(this.align_labels);

    // init aliased attributes
    ['change_flag'].forEach((a) => { this[a] = this[a]; }, this);
}




/*
    fieldValueChange(value, wcFormElement)
    a field value has changed from the UI side
*/
fieldValueChange(value, formElement){
    if (this.debug){ this.log(`fieldValueChange(${formElement.name}, ${value})`); }

    // send the field_value_changed custom event
    this.dispatchEvent(new CustomEvent("field_value_change", { detail: {
        name: formElement.name,
        value: formElement.value,
        formElement: formElement,
        self: this
    }}));
}
set fieldValueChangeCallback(f){
    if (f instanceof Function){
        this.addEventListener('field_value_change', (evt) => { f(evt.detail.name, evt.detail.value, evt.detail.formElement, evt.detail.self); });
    }
}




/*
    fieldUndo()
    the undo button got clicked on a formElement
*/
fieldUndo(formElement, btnUndo){
    if (this.debug){ this.log(`fieldUndo(${formElement.name})`); }
    /*
        insert further shenanigans here
    */
}




/*
    fieldMenu()
    the menu button got clicked on a formElement
*/
fieldMenu(formElement, btnUndo){
    if (this.debug){ this.log(`fieldMenu(${formElement.name})`); }
    /*
        insert logic here.
        it is of course entirely possible we don't *have* a menu here so
        yknow ... check that formElement.
    */
}








}
export { wcARSFormView };
