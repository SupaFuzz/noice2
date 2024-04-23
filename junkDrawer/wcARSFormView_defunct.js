/*
    wcARSFormView.js
    4/19/24     Amy Hicox <amy@hicox.com>

    this class accepts a noiceARSRow object on instantiation
    (and associated config data), and returns a UI composed
    from wcFormElement objects.

    docs to follow as I figure it out lol

    --> 4/22/24 @ 2023 <--
    at home. thinking this through.
    we cannot model the formView as a webComponent.
    here's why

    document.body.querySelectorAll('wc-ars-form-view')[0].arsRow.threadClient

    my god, that's just asking for trouble right there.
    the app must own the DOM. The DOM *cannot* contain references back to app objects.

    this means we CANNOT take ._app on webComponents

    actually. I'm not even sure storing callback references in the DOM is safe.
    actually the more I think about it, the more it definitely cannot be safe
    to do that.

    yeah private properties aint gonna save it
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties

    so ... how do we do callbacks on webComponents correctly?
    maybe we can emulate the Element.onclick((evt) => {...}) kinda shorthand
    for eventListeners?

    the DOM element never contains the callback reference, but exposes an event
    that can be fired, which the owner code owns. I think that's better.

    so something like this to attach the callback

    wcFormElement.addEventListener('capture_value', (evt) => {

            because we're limited on the evt interface
            there might be shenanigans about passing refs back
            need to look into that

    });

    and something like this in the class to setup the custom event
    this.dispatchEvent(new Event("capture_value", yadda yadda ))

    doesn't look too complicated
    https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events

    STILL THOUGH!
    even if we can do callbacks "securely" with event dispatchers, we still can't
    be *pulling this bullshit*

    how about like this.
    We yank all the stuff out that directly references arsRow
    and we paramatarize that. So we take the fieldConfig as an input (that we locally materialize)
    instead of a reference to the arsRow.fieldConfig. Mahybe mutate it a little bit so default
    values are included. -- basically here are the fields I want you to display and their current values.

    the arsRow will own the wcFormView via something like a .getFormView() function, that way
    the super dumb wcFormView is born with event listeners linked back into it's corresponding
    parent arsRow, and the DOM ONLY gets markup and events, no code references.

    this seems like the away
    operation data diode, baby.
    
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { noiceARSRow } from '../noiceARSRow.js';

import { wcFormElement } from './wcFormElement.js';
wcFormElement.registerElement('wc-form-element');

class wcARSFormView extends noiceAutonomousCustomElement {


static classID = wcARSFormView;
static classAttributeDefaults = {
    entry_id: { observed: true, accessor: true, type: 'str', value: '', forceAttribute: true },
    mode: { observed: true, accessor: true, type: 'enum', values: ['submit', 'modify'], value: 'submit', forceAttribute: true },
    locked: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    db_sync: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    change_flag: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true }
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

    // we really gotta have a noiceARSRow from the get-go.
    // I know it breaks markup instantiation but let's fix that later
    if (! (this.arsRow instanceof noiceARSRow) ){
        throw('arsRow is a rewquired argument');
    }
    this.mode = this.arsRow.mode;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        //locked: (n, o, v, s) => { s.toggleLocked(v, o); }
    };
}




/*
    getHTMLContent()
*/
getHTMLContent(){
    let div = document.createElement('div');
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

        if this is born from markup it won't have a reference to a noiceARSRow as input
        and hence we won't know what fields to draw. So I think we'll have to render
        with a null field container, then update as we get input
    */
    div.insertAdjacentHTML('afterbegin', `
        <div class="header" data-sync="${this.db_sync}">
            <span class="textField" data-name="entryId">${this.entry_id}</span>
            <span class="textField" data-name="mode">${this.mode}</span>
            <div class="buttonContainer">
                <button class="btnSave">${(this.mode == "create")?'create':'save'}</button>
            </div>
        </div>
        <div class="fieldContainer"></fieldContainer>
    `);
    this._elements.fieldContainer = div.querySelector('div.fieldContainer');
    this._elements.entryId = div.querySelector('span.textField[data-name="entryId"]');
    this._elements.mode = div.querySelector('span.textField[data-name="mode"]');
    this._elements.btnSave = div.querySelector('button.btnSave');
    this.renderFieldContainer(this._elements.fieldContainer);

    /*
        LOH 4/19/23 @ 1729 -- COB
        figguring it out but yeah. think i'm on the right track
    */

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
            {},
            fieldConfigEntry,
            ((fieldConfigEntry.modes instanceof Object) && (fieldConfigEntry.modes[this.mode] instanceof Object))?fieldConfigEntry.modes[this.mode]:{},
            {
                type: this.arsTypeToFormElementType(fieldConfigEntry.type),
                capture_value_on: 'change',
                captureValueCallback: (val, s) => { that.fieldValueChange(fieldConfigEntry.fieldName, val, s); },
                default_value: this.arsRow.rowData.hasOwnProperty(fieldConfigEntry.fieldName)?this.arsRow.rowData[fieldConfigEntry.fieldName]:null,
                name: fieldConfigEntry.fieldName
            }
        ));
    }
    return(this.formElements[fieldConfigEntry.fieldName]);
}



/*
    manageFormElements()

    this instantiates wcFormElement objects correlating to fields on this.arsRow.fieldConfig
    where:
        this.arsRow.fieldConfig[<fieldName>].modes[this.mode].display == true

    for each field matching this condition, if it does not exist, will be instantited.
    for each pre-existing field that does not exist in the config with this condition will be removed

    output is on this.formElements[fieldName]
*/
manageFormElements(){
    if (this.arsRow instanceof noiceARSRow){

        // make anything missing
        Object.keys(this.arsRow.fieldConfig).filter((fieldName) =>{return(
            (! this.formElements.hasOwnProperty(fieldName)) &&
            (this.arsRow.fieldConfig[fieldName] instanceof Object) &&
            (this.arsRow.fieldConfig[fieldName].modes instanceof Object) &&
            (this.arsRow.fieldConfig[fieldName].modes[this.mode] instanceof Object) &&
            this.arsRow.fieldConfig[fieldName].modes[this.mode].hasOwnProperty('display') &&
            (this.arsRow.fieldConfig[fieldName].modes[this.mode].display === true)
        )}, this).forEach((fieldName) => { this.formElements[fieldName] = this.getFormElement(this.arsRow.fieldConfig[fieldName])}, this);

        // prune anything removed
        Object.keys(this.formElements).filter((fieldName) => {return(!(
            (this.arsRow.fieldConfig[fieldName] instanceof Object) &&
            (this.arsRow.fieldConfig[fieldName].modes instanceof Object) &&
            (this.arsRow.fieldConfig[fieldName].modes[this.mode] instanceof Object) &&
            this.arsRow.fieldConfig[fieldName].modes[this.mode].hasOwnProperty('display') &&
            (this.arsRow.fieldConfig[fieldName].modes[this.mode].display === true)
        ))}, this).forEach((fieldName) => {
            this.formElements[fieldName].remove();
            delete(this.formElements[fieldName]);
        }, this);

    }else{
        if (this.debug){ this.log(`${this._className} v${this._version} | manageFormElements() called with no arsRow`); }
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

    // lets just try something dumb to start off with
    Object.keys(this.formElements).sort().forEach((fieldName) => {
        fieldContainerElement.appendChild(this.formElements[fieldName]);
    }, this);

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
}




/*
    defaultStyle attribute getter
*/
get defaultStyle(){
    /*
        put the internal stylesheet here
    */
    return(``);
}


/*
    getAttributeDefaults()
*/
getAttributeDefaults(){
    return(wcARSFormView.classAttributeDefaults);
}




/*
    fieldValueChange(fieldName, newValue. formElementRef)
*/
fieldValueChange(fieldName, newValue, formElementRef){
    // placeholder
}





}
export { wcARSFormView };
