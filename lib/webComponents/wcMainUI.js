/*
    wcMainUI.js
    5/2/25 Amy Hicox <amy@hicox.com>

    a layout like this:

    --------------------------------------------------------------------------------
    | <header_message>                                                      [=] (*)|
    --------------------------------------------------------------------------------
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                         <main_content>                                       |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    |                                                                              |
    --------------------------------------------------------------------------------

    slots:
        * header_message
        * burger_menu_content
        * status_menu_content
        * main_content
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { wcBalloonDialog } from './wcBalloonDialog.js';

class wcMainUI extends noiceAutonomousCustomElement {

static classID = wcMainUI;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_header: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    show_header_message: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    show_indicator: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    show_burger_menu: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    enable_burger_menu: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true, forceInit: true },
    show_main_content: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    burger_menu_open: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    menu_title: { observed: true, accessor: true, type: 'str', value: 'burgers', forceAttribute: true, forceInit: true }
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'header-height': { value: 'auto', global: true },
    'header-border-color': { value: 'rgba(92, 104, 107, .8)', global: true },
    'header-border-style': { value: 'solid', global: true },
    'header-border-width': { value: '1px', global: true },
    'header-background-color': { value: 'rgb(5, 15, 20)', global: true },
    'header-color': { value: 'rgb(191, 191, 24)', global: true },
    'disabled-opacity': { value: '.5', global: true },
    'disabled-filter': { value: 'grayscale(.9)', global: true },
    'burger-background': { value: `url('./gfx/buttons/burger.svg')`, global: true },
    'indicator-border-top-color': { value: 'rgba(216, 210, 210, .1)', global: true },
    'indicator-border-left-color': { value: 'rgba(216, 210, 210, .1)', global: true },
    'indicator-border-bottom-color': { value: 'transparent', global: true },
    'indicator-border-right-color': { value: 'transparent', global: true },
    'indicator-box-shadow': { value: '2px 2px 2px rgba(20, 22, 23, .8) inset', global: true },
    'indicator-background': { value: 'radial-gradient(rgba(255,255,255,.08), rgba(255,255,255,.01),rgba(255,255,255,.01))', global: true },
    'indicator-background-color': { value: 'rgb(12, 33, 46)', global: true },
    'indicator-background-color-transition': { value: '.35s ease-out', global: true },
    'indicator-pending-low-color': { value: 'rgba(230, 146, 64, .3)', global: true },
    'indicator-pending-high-color': { value: 'rgba(230, 146, 64, .65)', global: true },
    'indicator-net-read-color': { value: 'rgba(0, 153, 0, .35)', global: true },
    'indicator-net-write-color': { value: 'rgba(0, 153, 0, .65)', global: true },
    'indicator-db-read-color': { value: 'rgba(6, 133, 135, .35)', global: true },
    'indicator-db-write-color': { value: 'rgba(6, 133, 135, .65)', global: true },

}




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcMainUI';
    this._version = 1;
    this.cssVarPrefix = '--wc-main-ui';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcMainUI.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    this.attributeChangeHandlers = {
        burger_menu_open: (name, oldValue, newValue, slf) => {  if (oldValue != newValue){ slf.openBurgerMenu(newValue); } },
        enable_burger_menu: (name,o,n,s) => { s.enableBurgerMenu = n; },
        menu_title: (name,o,n,s) => {
            if (s.initialized && (s.burgerMenu instanceof wcBalloonDialog)){ s.burgerMenu.title = n; }
        }
    };

    this.mergeClassDefaults({
        _enableBurgerMenu: false
    });;

}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcMainUI.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcMainUI.classStyleDefaults);
}




/*
    enableBurgerMenu(bool)
*/
get enableBurgerMenu(){ return(this._enableBurgerMenu); }
set enableBurgerMenu(v){
    if (this.initialized && (this._elements.btnBurger instanceof Element)){
        this._elements.btnBurger.disabled = (! (v === true));
    }
    this._enableBurgerMenu = (v === true);
}




/*
    openBurgerMenu(bool)
*/
openBurgerMenu(bool){
    if (this.initialized && (this.burgerMenu instanceof wcBalloonDialog)){
        if (bool === true){ this.DOMElement.appendChild(this.burgerMenu); }else{ this.burgerMenu.exit(); }
    }
}



/*
    getHTMLContent()
*/
getHTMLContent(){
    let div = document.createElement('div');
    div.className = this._className;
    div.insertAdjacentHTML('afterbegin', `
        <div data-_name="header">
            <div class="titleContainer">
                <slot name="header_message" data-_name="header_message"></slot>
            </div>
            <div data-_name="btnContainer">
                <button data-_name="btnIndicator"></button>
                <button data-_name="btnBurger"></button>
            </div>
        </div>
        <div class="mainContainer">
            <slot name="main_content" data-_name="main_content"></slot>
        </div>
    `);
    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    let that = this;

    /*
        TO-DO: setup burgerMenu wcBalloonDialog dialog here
        bonus for finding a way to gank a burger_menu_content slot
        and boost it into the dialog. pretty sure that can be done
    */

    // make the burgerMenu
    this.burgerMenu = new wcBalloonDialog({
        arrow_position: 'topRight',
        title: this.menu_title,
        exitCallback: async (slf) => {
            that.burger_menu_open = false;
            return(false);
        },
    });
    this.burgerMenu.relativeElement = this._elements.btnBurger;

    // yoink!
    Array.from(that.children).filter((el) => {return(el.slot == "burger_menu_content")}).forEach((el) => {
        el.setAttribute('slot', 'dialogContent');
        that.burgerMenu.appendChild(el);
    });

    // hook for the burger
    that._elements.btnBurger.addEventListener('click', (evt) => { that.burger_menu_open = true; });

    // send the initialized event
    that.dispatchEvent(new CustomEvent("initialized", { detail: { self: that }}));
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: grid;
        width: 100vw;
        height: 100vh;
        grid-template-rows: ${this.styleVar('header-height')} auto;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
    }
    :host([show_header="false"]) div[data-_name="header"],
    :host([show_header_message="false"]) .titleContainer,
    :host([show_indicator="false"]) button[data-_name="btnIndicator"],
    :host([show_burger_menu="false"]) button[data-_name="btnBurger"],
    :host([show_main_content="false"]) .mainContainer
    {
        display: none;
    }
    div[data-_name="header"] {
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        background-color: ${this.styleVar('header-background-color')};
        color: ${this.styleVar('header-color')};
        height: ${this.styleVar('header-height')};
        border-bottom-color: ${this.styleVar('header-border-color')};
        border-bottom-style: ${this.styleVar('header-border-style')};
        border-bottom-width: ${this.styleVar('header-border-width')};
        overflow: hidden;
    }
    .mainContainer {
        overflow-y:auto;
    }
    div[data-_name="header"] div[data-_name="btnContainer"] {
        display: flex;
        flex-direction: row-reverse;
    }
    div[data-_name="header"] div[data-_name="btnContainer"] button:disabled {
        opacity: .5;
        filter: grayscale(.9);
    }
    div[data-_name="header"] div[data-_name="btnContainer"] button {
        height: 2rem;
        width: 2rem;
        margin: .5em;
    }
    button[data-_name="btnBurger"] {
        background: ${this.styleVar('burger-background')};
        border: none;
        background-size: contain;
        background-repeat: no-repeat;
        margin-right: 1rem;
    }
    div[data-_name="header"] div[data-_name="btnContainer"] button[data-_name="btnIndicator"] {
        height: 1.25rem;
        width: 1.25rem;
        align-self:  center;
        border-radius: 50%;
        border-width: .128em;
        border-top-color: ${this.styleVar('indicator-border-top-color')};
        border-left-color: ${this.styleVar('indicator-border-left-color')};
        border-bottom-color: ${this.styleVar('indicator-border-bottom-color')};
        border-right-color: ${this.styleVar('indicator-border-right-color')};;
        box-shadow: ${this.styleVar('indicator-box-shadow')};
        background: ${this.styleVar('indicator-background')};
        background-color: ${this.styleVar('indicator-background-color')};
        transition: background-color ${this.styleVar('indicator-background-color-transition')};
    }
    button[data-_name="btnIndicator"][data-status="pending"] {
        animation: pendingAni 3s linear infinite;
    }
    @keyframes pendingAni {
       0% {
          background-color: ${this.styleVar('indicator-pending-low-color')};
       }
       50% {
          background-color: ${this.styleVar('indicator-pending-high-color')};
       }
       100% {
          background-color: ${this.styleVar('indicator-pending-low-color')};
       }
    }
    button[data-_name="btnIndicator"][data-status="net-read"] {
        background-color: ${this.styleVar('indicator-net-read-color')};
    }
    button[data-_name="btnIndicator"][data-status="net-write"] {
        background-color: ${this.styleVar('indicator-net-write-color')};
    }
    button[data-_name="btnIndicator"][data-status="db-read"] {
        background-color: ${this.styleVar('indicator-db-read-color')};
    }
    button[data-_name="btnIndicator"][data-status="db-write"] {
        background-color: ${this.styleVar('indicator-db-write-color')};
    }
`)}




} // end class
const _classRegistration = wcMainUI.registerElement('wc-main-ui');
export { _classRegistration as wcMainUI };
