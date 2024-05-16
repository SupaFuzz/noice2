/*
    wcTable.js
    5/15/24 Amy Hicox <amy@hicox.com>

    this is a reimplementation of noiceCoreUITable as a webComponent
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcTable extends noiceAutonomousCustomElement {




static classID = wcTable;
static classAttributeDefaults = {

    // needs mapping
    label: { observed: true, accessor: true, type: 'str', value: '' },
    default_footer_message: { observed: true, accessor: true, type: 'str', value: null },

    // css props
    show_footer: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    show_btn_prefs: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_btn_select_all: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_btn_select_none: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_btn_export: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_footer_message: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_row_nudge_buttons: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },

    /*
        ex:
        disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
        message: { observed: true, accessor: true, type: 'str', value: '' },
        size: { observed: true, accessor: true, type: 'int', value: 20 },
        options: { observed: true, accessor: true, type: 'json', key: 'values', value: []},
        wrap: { observed: true, accessor: true, type: 'enum', values:['hard','soft','off'], value: 'off' },
        value: { observed: true, accessor: true, type: 'float', value: 1.618 },
    */
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(args){
    super(args);
    this._className = 'wcTable';
    this._version = 1;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        /*
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcTable.classAttributeDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;

    div.innerHTML =
       `<div class="label" data-templatename="label" data-templateattribute="true"></div>
        <div data-templatename="uiContainer" data-templateattribute="true" style="">
            <div class="tableContainer" data-templatename="tableContainer">
                <div class="tableHeader hdrRow" data-templatename="tableHeader" data-templateattribute="true">
                    <div data-templatename="headerRow" data-templateattribute="true"></div>
                </div>
                <div class="tableListContainer" data-templatename="tableListContainer" data-templateattribute="true"></div>
            </div>
        </div>
        <div class="footer" data-templatename="footer" data-templateattribute="true">
            <div class="buttonContainer" data-templatename="footerButtonContainer">
                <button class="btnPrefs txtBtn" data-templatename="btnPrefs" data-templateattribute="true">columns</button>
                <button class="btnSelectAll txtBtn" data-templatename="btnSelectAll" data-templateattribute="true" disabled>select all</button>
                <button class="btnSelectNone txtBtn" data-templatename="btnSelectNone" data-templateattribute="true" disabled>select none</button>
                <button class="btnExport txtBtn" data-templatename="btnExport" data-templateattribute="true" disabled>export</button>
                <button class="btnNudgeUp txtBtn" data-templatename="btnNudgeUp" data-templateattribute="true" disabled>&#9650;</button>
                <button class="btnNudgeDown txtBtn" data-templatename="btnNudgeDown" data-templateattribute="true" disabled>&#9660;</button>
            </div>
            <div class="footerMessage" data-templatename="footerMessage" data-templateattribute="true"></div>
        </div>`;

    // snarf the ._elements
    Array.from(div.querySelectorAll('[data-templateattribute="true"]')).filter((el) =>{return(this.isNotNull(el.dataset.templatename))}, this).forEach((el) => {
        this._elements[el.dataset.templatename] = el;
    }, this);

    // alias ._elements to ._DOMElements for the sake of the laze
    this._DOMElements = this._elements;

    that._DOMElements.btnPrefs.addEventListener('click', (evt) => { that.openPrefEditor(evt); that._DOMElements.btnPrefs.blur(); });
    that._DOMElements.btnSelectAll.addEventListener('click', (evt) => { that.handleSelectAll(evt); that._DOMElements.btnSelectAll.blur(); });
    that._DOMElements.btnSelectNone.addEventListener('click', (evt) => { that.handleSelectNone(evt); that._DOMElements.btnSelectNone.blur(); });
    that._DOMElements.btnExport.addEventListener('click', (evt) => { that.openExportUI(evt); that._DOMElements.btnExport.blur(); });
    that._DOMElements.btnNudgeUp.addEventListener('click', (evt) => { that.nudgeSelection('up', 1); that._DOMElements.btnNudgeUp.blur(); });
    that._DOMElements.btnNudgeDown.addEventListener('click', (evt) => { that.nudgeSelection('down', 1); that._DOMElements.btnNudgeDown.blur(); });

    /*
        LOH 5/15/24 @ 2209
        none of the above functions exist.
        next step porting them in.

        after that .prefEditorFrameThingy ... ugh
    */


    /*
        insert shenanigans here
        also set this._elements references if needed
        also setup default event listeners if needed
    */

    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    /*
        doeth thine settting up things here
    */
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
    }
    div[data-templatename="uiContainer"] {
        position: relative;
        width: 100%;
    }
    div[data-templatename="footer"] {
        grid-template-columns: auto auto;
        align-items: center;
    }
    div[data-templatename="footer"] div.buttonContainer {
        text-align: left;
    }
    div[data-templatename="footerMessage"] {
        overflow: auto;
    }
    div[data-templatename="tableListContainer"] {
        display: grid;
        scrollbar-width: thin;
        scrollbar-gutter: stable;
        overflow-y: auto;
        min-width: fit-content;
        align-content: baseline;
    }
    div[data-templatename="headerRow"] {
        scrollbar-width: thin;
        scrollbar-gutter: stable;
    }
    div[data-templatename="tableContainer"] {
        scrollbar-width: thin;
    }

    /* visibility toggles */
    :host([show_footer="false"]) div[data-templatename="footer"],
    :host([show_btn_prefs="false"]) div[data-templatename="footerButtonContainer"] button.btnPrefs,
    :host([show_btn_select_all="false"]) div[data-templatename="footerButtonContainer"] button.btnSelectAll,
    :host([show_btn_select_none="false"]) div[data-templatename="footerButtonContainer"] button.btnSelectNone,
    :host([show_btn_export="false"]) div[data-templatename="footerButtonContainer"] button.btnExport,
    :host([show_footer_message="false"]) div[data-templatename="footerMessage"],
    :host([show_row_nudge_buttons="false"]) div[data-templatename="footerButtonContainer"] button.btnNudgeUp,
    :host([show_row_nudge_buttons="false"]) div[data-templatename="footerButtonContainer"] button.btnNudgeDown,
    {
        display: none;
    }
`)};


}
export { wcTable };
