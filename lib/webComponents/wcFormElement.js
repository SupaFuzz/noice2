/*
    wpFormElement.js
    4/12/24 Amy Hicox <amy@hicox.com>

    this implements a base class for a webComponent version
    of a noiceCoreUIFormElement basically.

    though descending from autonomous, this will have an embedded input of of these types
        checkbox        https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
        color           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
        date            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date
        datetime-local  https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
        email           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
        file            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
        month           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month
        number          https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
        password        https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password
        radio           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
        range           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range
        search          https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search
        tel             https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/tel     (telephone number)
        text            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text
        time            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time
        url             https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url
        week            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week

    to-do:
        * everything
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { isNull, isNotNull, getGUID } from '../noiceCore.js';

class wcFormElement extends noiceAutonomousCustomElement {




static classID = wcFormElement;

static classAttributeDefaults = {

    // completed
    required: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    label_position: { observed: true, accessor: true, type: 'enum', value: 'top', values: ['top', 'left', 'embed', 'none'], forceAttribute: true},
    show_undo_button: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_menu_button: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    message_is_error: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    message: { observed: true, accessor: true, type: 'str', value: '' },
    undo_button_text: { observed: true, accessor: true, type: 'str', value: '⎌' },
    menu_button_text: { observed: true, accessor: true, type: 'str', value: '⋯' },
    label: { observed: true, accessor: true, type: 'str', value: null },
    size: { observed: true, accessor: true, type: 'int', value: 20 },
    name: { observed: true, accessor: true, type: 'str', value: 'wcFormElement', forceAttribute: true },
    type: { observed: true, accessor: true, type: 'enum', value: 'text', values: [
        'checkbox', 'color', 'date', 'datetime-local', 'email', 'file', 'month', 'number',
        'password', 'radio', 'range', 'search', 'tel', 'text', 'time', 'url', 'week', 'select'
    ], forceAttribute: true},
    options: { observed: true, accessor: true, type: 'json', key: 'values', value: []},
    default_value: { observed: true, accessor: true, type: 'str', value: '' },


    // wip
    capture_value_on: { observed: true, accessor: true, type: 'enum', value: 'none', values: ['none', 'focusout', 'return', 'focusoutOrReturn', 'keypress', 'input', 'change'] }

    /*
        LOH 4/12/24 @ 1705
        https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation

        theres new jazz we can take advantage of.
        specifically the CSS selectors and built-in validations
        if we can play that without the need for an actual form and a submit
        and all of that, could be quite lean.

        I mean still gonna need all the validation hooks and stuff from noiceCoreRow etc.
        but using these css selectors and builtin validations for nullable, etc.

        might be good
    */


    /*
        visual stuffs -- like if you don't wanna wholsale replace the stylesheet
        these'll override by setting style props on the elements themselves
        at a minumum:

        color:                      <foreground text color>
        background_color            <solid color background for input>
        button_color:               <forefround color on buttons>
        button_background_color     <background color on buttons>
        font_size                   <at the root level>
        input_font_size             <specifically on the input>

    */


}

// observedAttributes
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(){
    super();
    this._className = 'wcFormElement';
    this._version = 1;
    this._initialized = false;
    this._charts = {};
    this._guidCache = {};
    this._elements = {};
    this._options = [];
    this._listeners = {};

    // we have to make a hard copy of the classAttributeDefaults to use as our local copy
    this.attributeDefaults = JSON.parse(JSON.stringify(wcFormElement.classAttributeDefaults));

    // spawn the attribute accessors
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        label_position: (n, o, v, s) => { s.setLabelPosition(v, o); },
        disabled: (n, o, v, s) => { s.toggleDisabled(v); },
        message: (n, o, v, s) => { s.updateMessage(v); },
        undo_button_text: (n, o, v, s) => { s.updateButtonText('btnUndo', v); },
        menu_button_text: (n, o, v, s) => { s.updateButtonText('btnMenu', v); },
        label: (n, o, v, s) => { s.updateLabelText(v); },
        size: (n, o, v, s) => { s.setSize(v); },
        name: (n, o, v, s) => { s.setName(v); },
        type: (n, o, v, s) => { s.setType(v, o); },
        options: (n, o, v, s) => { s.setOptions(v); },
        default_value: (n, o, v, s) => { s.setDefaultValue(v); },
        capture_value_on: (n, o, v, s) => { s.setCaptureValueOn(v); }
    }
}




/*
    getFormElementMarkup(labelGUID, dataGUID)
    return the markup for the formElement input based on type and stuff
    might need to extend or override this in subclasses
    the input guid gets used for the id, to link the label and the dataList
*/
getFormElementMarkup(labelGUID, dataGUID){

    // this will likely need a big switch based on type, but for the moment we're just playing dumb
    return(`<${(this.type == "select")?'select':'input'}
        class="formElement"
        ${this.isNotNull(labelGUID)?`id="${labelGUID}"`:''}
        ${this.isNotNull(dataGUID)?`list="${dataGUID}"`:''}
        name="${this.name}"
        type="${this.type}"
        value="${this.isNull(this.value)?this.default_value:this.value}"
        ${(this.disabled)?'disabled':''}
        ${(this.required)?'required':''}
    ></${(this.type == "select")?'select':'input'}>`)
}




/*
    formElement getter
    just returns the input element
*/
get formElement(){
    return(this.initialized?this.shadowDOM.querySelector(`${(this.type == "select")?'select':'input'}.formElement`):null);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.dataset.theme = this.theme;
    div.dataset.guid = getGUID(this._guidCache);
    let listGUID = getGUID(this._guidCache);
    div.insertAdjacentHTML('afterbegin', `
        <label for="${div.dataset.guid}">${this.label}</label>
        <div class="formElementContainer">${this.getFormElementMarkup(div.dataset.guid, listGUID)}</div>
        <div class="btnContainer">
            <button class="btnUndo">${this.undo_button_text}</button>
            <button class="btnMenu">${this.menu_button_text}</button>
        </div>
        <div class="message">${this.message}</div>
        <datalist id="${listGUID}"></datalist>
    `);
    this._elements.label = div.querySelector('label');
    this._elements.input = div.querySelector('input');
    this._elements.btnContainer = div.querySelector('div.btnContainer');
    this._elements.btnUndo = this._elements.btnContainer.querySelector('button.btnUndo');
    this._elements.btnMenu = this._elements.btnContainer.querySelector('button.btnMenu');
    this._elements.message = div.querySelector('div.message');
    this._elements.datalist = div.querySelector("datalist");

    let that = this;
    this._elements.btnUndo.addEventListener('click', (evt) => { that.undoClickhandler(evt); });
    this._elements.btnMenu.addEventListener('click', (evt) => { that.menuClickhandler(evt); });

    // LOOSE END
    // gonna need something overridable here for setting up listeners on the
    // formElement, because we're gonna be doing yank/replace shenanigans to handle <select>

    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set
*/
initializedCallback(){
    // if we're a select, init our options should we have them
    if ((this.type == "select") || this.isNotNull(this.options)){ this.setOptions(this.options); }
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    /* label_position: top */
    :host([label_position="top"]) .wcFormElement {
      grid-template-columns: auto auto;
    }
    :host([label_position="top"]) .wcFormElement label, :host([label_position="top"]) .wcFormElement .message {
      grid-column: 1/3;
      margin-left: .25em;
    }

    /* label_position: left */
    :host([label_position="left"]) .wcFormElement {
      grid-template-columns: auto auto auto;
    }
    :host([label_position="left"]) .wcFormElement label {
      text-align: right;
      margin-right: .25em;
    }
    :host([label_position="left"]) .wcFormElement .message {
      grid-column: 2/3;
      margin-left: .25em;
    }

    /* label_position: embed and none */
    :host([label_position="embed"]) .wcFormElement, :host([label_position="none"]) .wcFormElement {
      grid-template-columns: auto auto;
    }
    :host([label_position="embed"]) .wcFormElement label, :host([label_position="none"]) .wcFormElement label {
      display: none;
    }

    /* layout and geometry */
    .wcFormElement {
      display: grid;
      align-items: center;
      width: max-content;
    }
    .formElement {
      font-size: 1em;
      border-radius: .5em;
      padding: .25em;
      border-color: transparent;
    }
    .btnContainer {
      width: max-content;
      display: flex;
      flex-direction:  row-reverse;
      align-items: center;
    }
    .btnContainer button {
      font-size: 1.128em;
      height: 1.25em;
      width: 1.25em;
      border-radius: 50%;
      border: none;
      margin-left: .25em;
      display: grid;
      place-content:center;
    }
    :host([show_undo_button="false"]) .btnContainer button.btnUndo {
      display: none;
    }
    :host([show_menu_button="false"]) .btnContainer button.btnMenu {
      display: none;
    }
    .message {
      font-size: .8em;
      font-style: italic;
    }

    /* colors and themes */

    /* disabled */
    :host([disabled="true"]) label, :host([disabled="true"]) .message {
      color: var(--theme-disabled-color, rgb(240, 240, 240));
    }
    :host([disabled="true"]) .formElement, :host([disabled="true"]) .btnContainer button {
      background-color: var(--theme-disabled-background-color);
      color: var(--theme-disabled-color);
    }

    /* required */
    :host([required="true"]:not([disabled="true"])) label {
      color: var(--theme-required-field-label, rgb(240, 240, 240));
    }

    /* buttons */
    .btnContainer button{
      background-color: var(--theme-button-background);
      color: var(--theme-button-foreground);
    }

    /* fields */
    .formElement {
      background: var(--theme-field-background);
      border: var(--theme-field-border);
      color: var(--theme-field-foreground);
      box-shadow: var(--theme-field-boxshadow);
    }
    .formElement:focus {
      background: var(--theme-field-focus-background);
    }
    :host([message_is_error="true"]) .formElement {
      border-color: var(--theme-error-color);
    }
    .formElement optgroup {
      background-color: var(--theme-disabled-background-color);
      color: var(--theme-field-foreground);
    }
    .formElement option {
      background-color: var(--theme-field-option-background);
      color: var(--theme-field-foreground);
    }

    /* message */
    .message {
      color: var(--theme-button-background);
    }
    :host([message_is_error="true"]) .message {
      color: var(--theme-error-color);
    }
    :host([message_is_error="true"]) .message:before {
      content: '⚠︎ ';
      font-style: normal;
    }
`)}




/*
    ----------------------------------------------------------------------
    all the good stuff functions go down here
    ----------------------------------------------------------------------
*/




/*
    value getter and setter
*/
get value(){
    return(this.initialized?this.formElement.value:this.default_value)
}
set value(v){
    if (this.initialized){ this.formElement.value = v; }
}




/*
    captureValue(event)
*/
captureValue(evt){
    /*
        LOH 4/16/24 @ 1658 -- COB
        this needs to call something like a valueChangedCallback or something of that nature
        I don't *believe* this should fire the value setter above. But being aware of sequencing
        etc is gonna be important.

        this will be the bit where *maybe* we take a second hack at label_position:embed

        but yeah basically this should get called when the user interacts on the UI
        or someone calls the value setter.

        I think.
        watch out for dem loopz. could get spaghettified 
    */
}



/*
    undoClickhandler(evt)
    btnUndo got clicked
*/
undoClickhandler(evt){
    if (this.undoCallback instanceof Function){
        if (this._elements.btnUndo instanceof Element){ this._elements.btnUndo.disabled = true; }
        let that = this;
        this.undoCallback(this).then(() => {
            if (this._elements.btnUndo instanceof Element){ this._elements.btnUndo.disabled = false; }
        }).catch((error) => {
            throw(`${that._className} v${that._version} | ${that.name} | undoClickhandler() | undoCallback() threw unexpectedly: ${error}`);
        })
    }
}




/*
    menuClickhandler(evt)
    btnUndo got clicked
*/
menuClickhandler(evt){
    if (this.menuCallback instanceof Function){
        if (this._elements.btnMenu instanceof Element){ this._elements.btnMenu.disabled = true; }
        let that = this;
        this.menuCallback(this).then(() => {
            if (this._elements.btnMenu instanceof Element){ this._elements.btnMenu.disabled = false; }
        }).catch((error) => {
            throw(`${that._className} v${that._version} | ${that.name} | menuClickhandler() | menuCallback() threw unexpectedly: ${error}`);
        })
    }
}








/*
    ----------------------------------------------------------------------
    attributeChangeHandler functions go down here
    ----------------------------------------------------------------------
*/




/*
    setLabelPosition(newPosition, oldPosition)
    we'll need this for the 'embed' mode shenanigans
    however, the layout n such is just in the CSS
    so be careful overriding it
*/
setLabelPosition(newPosition, oldPosition){

    // insert shenanigans here
    console.log(`setLabelPosition(${newPosition}, ${oldPosition})`);

}




/*
    toggleDisabled(bool)
    disabled is unique in that specifying disabled="false" means the same thing
    as disabled="true". It has to either be there or not at all. w00t!
*/
toggleDisabled(n){
    if (this.initialized){
        this.shadowDOM.querySelectorAll('.formElement').forEach((el) => {
            if (n === true){ el.disabled = true; }else{ el.removeAttribute('disabled'); }
        });
        this.shadowDOM.querySelectorAll('button').forEach((el) => {
            if (n === true){ el.disabled = true; }else{ el.removeAttribute('disabled'); }
        });
    }
}




/*
    updateMessage(message, isError)
    set the message. if isError is true, set message_is_error while we're at it
*/
updateMessage(message, isError){
    if (this.initialized){
        let el = this.shadowDOM.querySelector('.message');
        if (el instanceof Element){ el.textContent = message; }
        this.message_is_error = (isError === true);
    }
}




/*
    updateButtonText(button.className, value)
*/
updateButtonText(btnClassName, message){
    if (this.initialized){
        let el = this.shadowDOM.querySelector(`.btnContainer button.${btnClassName}`);
        if (el instanceof Element){ el.textContent = message; }
    }
}




/*
    updateLabelText(value)
*/
updateLabelText(message){
    if (this.initialized){
        let el = this.shadowDOM.querySelector(`label`);
        if (el instanceof Element){ el.textContent = message; }
    }
}




/*
    setSize(value)
*/
setSize(size){
    if (this.initialized){
        let el = this.shadowDOM.querySelector(`.formElement`);
        if (el instanceof Element){ el.setAttribute('size', size); }
    }
}




/*
    setName(name)
*/
setName(name){
    let el = this.formElement;
    if (el instanceof Element){ el.setAttribute('name', name); }
}




/*
    setType(type, oldType)
    I mean ... I dunno, maybe it'll just work?
*/
setType(type, oldType){
    // can't use formElement attribute because the .type attribute already changed :-/
    let el =this.shadowDOM.querySelector('div.formElementContainer .formElement');
    if (el instanceof Element){
        if (
            ((type == "select") && (oldType !== "select")) ||
            ((type !== "select") && (oldType == "select"))
        ){

            // actually gotta replace it. w00t! thx "living spec" lol
            el.remove();
            this.shadowDOM.querySelector('div.formElementContainer').insertAdjacentHTML('afterbegin', this.getFormElementMarkup(el.getAttribute('id'), el.getAttribute('list')));

            // if it's a select update the select options
            if (type == 'select'){ this.setOptions(this.options); }

            // LOOSE END: need hook to port event listeners n such.


        }else{
            el.setAttribute('type', type);
        }
    }
}




/*
    setOptions(data);
    options has changed, we need to either spew them into the list or the select depending
    data can be one of these formats:

        [ array, of, values]
        [ [value, aliasValue], ... ]
        { <heading>: [array, of, values], <heading2>: [[value, aliasValue]. value, ...]}

*/
setOptions(data){
    if (this.initialized){

        // handle selects
        if (this.type == "select"){

            // empty exiting values
            for (let i=(this.formElement.options.length - 1); i >= 0; i--){ this.formElement.remove(i); }

            // regular old array but might contain objects with value aliases
            if (data instanceof Array){

                data.map((value) => {
                    let el = document.createElement('option');

                    // if it's an embedded array it's [<value>, <displayText>]
                    if ((value instanceof Array) && (value.length >= 2)){
                        el.value = value[0];
                        el.text = value[1];
                        el.selected = (this.value == value[0]);
                    }else{
                        el.value = value;
                        el.text = value;
                        el.selected = (this.value == value);
                    }
                    return(el);
                }).forEach((el) => { this.formElement.add(el); });

            // optgroup stuff
            }else if (data instanceof Object){

                // object keys are optgroup headings, and should contain arrays
                // yeah it could get nested, but I'm not even trynna deal with it today
                // root level only
                Object.keys(data).map((heading) => {
                    let el = document.createElement('optgroup');
                    el.label = heading;
                    if (data[heading] instanceof Array){
                        data[heading].map((value) => {
                            let elo = document.createElement('option');

                            // if it's an embedded array it's [<value>, <displayText>]
                            if ((value instanceof Array) && (value.length >= 2)){
                                elo.value = value[0];
                                elo.text = value[1];
                                elo.selected = (this.value == value[0]);
                            }else{
                                elo.value = value;
                                elo.text = value;
                                elo.selected = (this.value == value);
                            }
                            return(elo);
                        }).forEach((opt) => { el.append(opt); })
                    }
                    return(el);
                }).forEach((el) => { this.formElement.add(el); })
            }

        // handle everything else
        }else if (data instanceof Array){
            let el = this.shadowDOM.querySelector('datalist');
            if (el instanceof Element){
                el.innerHTML = data.map((v) => {return(`<option value="${v}"></option>`)}).join("");
            }
        }
    }
}




/*
    setDefaultValue(value)
*/
setDefaultValue(value){
    if (this.isNull(this.value)){ this.value = value; }
}




/*
    setCaptureValueOn(mode)
    modes: ['none', 'focusout', 'return', 'focusoutOrReturn', 'keypress', 'input', 'change']
*/
setCaptureValueOn(mode){
    if (this.initialized){

        // tear down any existing listeners
        Object.keys(this._listeners).forEach((evt) => { this.formElement.removeEventListener(evt, this._listeners[evt]); }, this);
        let that = this;
        switch(mode){
            case 'focusout':
                that._listeners.focusout = that.getEventListenerWrapper((evt) => { that.captureValue(evt); });
                that.formElement.addEventListener('focusout', that._listeners.focusout);
                break;
            case 'return':
                that._listeners.keydown = that.getEventListenerWrapper((evt) => { if (evt.keyCode == 13){ that.captureValue(evt); } });
                that.formElement.addEventListener('keydown', that._listeners.keydown);
                break;
            case 'focusoutOrReturn':
                that._listeners.keydown = that.getEventListenerWrapper((evt) => { if (evt.keyCode == 13){ that.formElement.blur(); } });
                that._listeners.focusout = that.getEventListenerWrapper((evt) => { that.captureValue(evt); });
                that.formElement.addEventListener('focusout', that._listeners.focusout);
                break;
            case 'keypress':
                that._listeners.keypress = that.getEventListenerWrapper((evt) => { that.captureValue(evt); });
                that.formElement.addEventListener('keypress', that._listeners.keypress);
                break;
            case 'input':
                that._listeners.input = that.getEventListenerWrapper((evt) => { that.captureValue(evt); });
                that.formElement.addEventListener('input', that._listeners.input);
                break;
            case 'change':
                that._listeners.change = that.getEventListenerWrapper((evt) => { that.captureValue(evt); });
                that.formElement.addEventListener('change', that._listeners.change);
                break;
        }
    }
}



}
export { wcFormElement };