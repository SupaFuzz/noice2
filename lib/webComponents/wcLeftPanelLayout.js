/*
    wcLeftPanelLayout.js
    Amy Hicox <amy@hicox.com> 8/16/24

    ------------------------------
    |          |                 |
    |  ctrl    |      main       |
    |          |                 |
    ------------------------------
    (open)

    ------------------------------
    | |                           |
    |>|          main             |
    | |                           |
    ------------------------------
    (closed)

    like that
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
class wcLeftPanelLayout extends noiceAutonomousCustomElement {

static classID = wcLeftPanelLayout;
static classAttributeDefaults = {
    open: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {

    'panel-background': { value: 'radial-gradient(ellipse at bottom right, rgba(53, 57, 59, .4), rgba(53, 57, 59, .3), rgba(53, 57, 59, .2),rgba(53, 57, 59, .1), rgba(53, 57, 59, 0))', global: true },
    'panel-background-color': { value: 'rgb(2, 6, 9)', global: true },
    'panel-border': {value: '.128em solid rgba(240, 240, 240, .2)', global: true },
    'content-background': { value: 'linear-gradient(rgba(240, 240, 240,.18), rgba(240, 240, 240,0), rgba(240, 240, 240,0))', global: true },
    'content-background-color': { value: 'rgb(2, 6, 9)', global: true },
    'handle-background': { value: 'none', global: true },
    'handle-background-color': { value: 'rgb(5, 15, 20)', global: true },
    'control-panel-background': { value: 'linear-gradient(rgba(240, 240, 240,.18), rgba(240, 240, 240,0), rgba(240, 240, 240,0))', global: true },
    'control-panel-background-color': { value: 'rgb(2, 6, 9)', global: true },
    'control-panel-border': { value: '.064em solid rgba(240, 240, 240, .2)', global: true },
    'control-panel-box-shadow': { value: '0 .128em .128em rgba(20, 22, 23, .3)', global: true },
    'close-button-color': { value: 'rgb(240, 240, 240)', global: true},
    'close-button-font-size': { value: '1em', global: true },
    'close-button-font-family': { value: 'Comfortaa', global: true },
    'title-font-size': { value: '1em', global: true },
    'title-font-family': { value: 'Comfortaa', global: true },
};




/*
    constructor
*/
constructor(args){
    super(args);
    this._className = 'wcLeftPanelLayout';
    this._version = 1;
    this._listeners = {};
    this.cssVarPrefix = '--wc-leftpanellayout';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcLeftPanelLayout.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        //attribute: (name, oldVal, newVal, selfRef) => { ... }
    }
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcLeftPanelLayout.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcLeftPanelLayout.classStyleDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.insertAdjacentHTML('afterbegin', `
        <div data-_name="leftMenu">
            <div data-_name="menuContent">

                    <div data-_name="ctlPnl">
                        <div class="controlPanel">
                            <button data-_name="btnClose">close</button>
                            <div data-_name="buttonContainer"></div>
                        </div>
                        <h3 data-_name="title">test</h3>
                    </div>
                <div data-_name="menu"></div>
            </div>
            <div data-_name="handle"></div>
        </div>
        <div data-_name="main"></div>
    `);
    return(div);
}




/*
    initializedCallback(slf)
*/
initializedCallback(){
    let that = this;
    that._elements.btnClose.addEventListener('click', (evt) => {
        that._elements.handle.click();
    });

    that._elements.handle.addEventListener('click', (evt) => {
        that.open = (!(that.open == true));
    });

    if (that.initCallback instanceof Function){
        that.initCallback(that);
    }

}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
    }
    :host([open="true"]) div.${this._className} {
        grid-template-columns: 33% 67%;
    }
    div.${this._className} {
        display: grid;
        grid-template-columns: 1.5em auto;
        width: 100%;
        height: 100%;
        transition: grid-template-columns .4s ease-in-out;
    }
    :host([open="true"]) div[data-_name="leftMenu"]{
        grid-template-columns: auto 0em;
    }
    div[data-_name="leftMenu"]{
        background: ${this.styleVar('panel-background')};
        background-color: ${this.styleVar('panel-background-color')};
        display: grid;
        grid-template-columns: auto 1.5em;
        overflow-y: hidden;
        transition: grid-template-columns .4s ease-in-out;
        border-right: ${this.styleVar('panel-border')};
    }
    div[data-_name="menuContent"]{
        overflow-y: auto;
    }
    div[data-_name="handle"]{
        background: ${this.styleVar('handle-background')};
        background-color: ${this.styleVar('handle-background-color')};
        display: grid;
        place-items: center;
    }
    :host([open="false"]) div[data-_name="handle"]:hover:after{
        content: '\\25B6';
    }
    :host([open="false"]) div[data-_name="handle"]:after{
        content: '\\25B7';
    }
    div[data-_name="main"]{
        background: ${this.styleVar('content-background')};
        background-color: ${this.styleVar('content-background-color')};
        overflow-y: auto;
    }
    div[data-_name="ctlPnl"]{
        position: sticky;
        top: 0;
        display: grid;
        background: ${this.styleVar('control-panel-background')};
        background-color: ${this.styleVar('control-panel-background-color')};
        border-bottom: ${this.styleVar('control-panel-border')};
        box-shadow: ${this.styleVar('control-panel-box-shadow')};
    }
    div[data-_name="buttonContainer"]{
        width: 100%;
        display: flex;
        flex-direction: row-reverse;
    }
    div.controlPanel {
        display: flex;
    }
    button[data-_name="btnClose"]:hover {
        opacity: 1;
    }
    button[data-_name="btnClose"]{
        background-color: transparent;
        border: none;
        color: ${this.styleVar('close-button-color')};
        font-size: ${this.styleVar('close-button-font-size')};
        font-family: ${this.styleVar('close-button-font-family')};
        opacity: .6;
    }
    button[data-_name="btnClose"]:hover:before {
        content: '\\25C0';
        padding-right: .25em;
    }
    button[data-_name="btnClose"]:before {
        content: '\\25C1';
        padding-right: .25em;
    }
    div[data-_name="buttonContainer"] button.icon:hover {
        opacity: 1;
    }
    div[data-_name="buttonContainer"] button.icon {
        background-color: transparent;
        border: none;
        font-size: 1em;
        opacity: .5;
        color: ${this.styleVar('close-button-color')};
        width: 1.5em;
        height: 1.5em;
        margin-right: .25em;
    }
    h3[data-_name="title"]{
       margin: .75em 0 .25em 1.25em;
       font-size: ${this.styleVar('title-font-size')};
       font-family: ${this.styleVar('title-font-family')};
    }
`)};



}
const _classRegistration = wcLeftPanelLayout.registerElement('wc-left-panel-layout');
export { _classRegistration as wcLeftPanelLayout };
