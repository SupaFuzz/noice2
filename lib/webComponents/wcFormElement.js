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
    name: { observed: true, accessor: true, type: 'str', value: 'wcFormElement' },
    type: { observed: true, accessor: true, type: 'enum', value: 'text', values: [
        'checkbox', 'color', 'date', 'datetime-local', 'email', 'file', 'month', 'number',
        'password', 'radio', 'range', 'search', 'tel', 'text', 'time', 'url', 'week'
    ]},

    requireed: { observed: true, accessor: true, type: 'bool', value: false },
    disabled: { observed: true, accessor: true, type: 'bool', value: false },
    size: { observed: true, accessor: true, type: 'int', value: 20 },

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

    value: { observed: true, accessor: true, type: 'str', value: null },
    label: { observed: true, accessor: true, type: 'str', value: null },
    label_position: { observed: true, accessor: true, type: 'enum', value: 'top', values: ['top', 'left', 'embed', 'none']},
    button_position: { observed: true, accessor: true, type: 'enum', value: 'right', values: ['right', 'bottom'] },

    show_undo_button: { observed: true, accessor: true, type: 'bool', value: false },
    show_menu_button: { observed: true, accessor: true, type: 'bool', value: false },
    undo_button_text: { observed: true, accessor: true, type: 'str', value: 'undo' },
    menu_button_text: { observed: true, accessor: true, type: 'str', value: '...' },

    message: { observed: true, accessor: true, type: 'str', value: '' },
    message_is_error: { observed: true, accessor: true, type: 'bool', value: false },

    options: { observed: true, accessor: true, type: 'json', key: 'values', value: []}

}

// observedAttributes
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(){
    super();
    this._className = 'wpPieChart';
    this._version = 1;
    this._initialized = false;
    this._charts = {};
    this._guidCache = {};
    this._elements = {};
    this._options = []

    // we have to make a hard copy of the classAttributeDefaults to use as our local copy
    this.attributeDefaults = JSON.parse(JSON.stringify(wcFormElement.classAttributeDefaults));

    // spawn the attribute accessors
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        //size:  (name, oldValue, newValue, slf) => { slf.setSize(newValue); },
    }
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.dataset.guid = getGUID(this._guidCache);
    let listGUID = getGUID(this._guidCache);
    div.insertAdjacentHTML('afterbegin', `
        <label for="${div.dataset.guid}">${this.label}</label>
        <input
            id="${div.dataset.guid}"
            name="${this.name}"
            type="${this.type}"
            list="${listGUID}"
            value="${this.value}"
            ${(this.disabled)?'disabled':''}
            ${(this.required)?'required':''}
        ></input>
        <div class="btnContainer">
            <button class="btnUndo" data-show="${this.show_undo_button}">${this.undo_button_text}</button>
            <button class="btnMenu" data-show="${this.show_menu_button}">${this.menu_button_text}</button>
        </div>
        <div class="message" data-error="${this.message_is_error}">${this.message}</div>
        <datalist id="${listGUID}">${this._options.map((v) => {return(`<option value="${v}"></option>`)}).join("")}</datalist>
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

    return(div);
}




/*
    style getter
*/
get style(){return(`
    /* insert scoped CSS here */
`)}




/*
    ----------------------------------------------------------------------
    alld the good stuff functions go down here
    ----------------------------------------------------------------------
*/




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



}
export { wcFormElement };
