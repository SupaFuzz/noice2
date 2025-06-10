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
        * main_content
        * status_menu_content

    events:
        * open_dialog(dialog_name)
        * close_dialog(dialog_mame)
          where dialog_name: user_query, progress_dialog, alert_dialog, burger_menu, status_menu

    fuctions:
        * async userQuery(args)

    5/8/25 @ 2201 -- to-do list
        * disabled bool implementation with visual queue

    after all that ...
        * webComponentize uiHolder/ui
        * webComponentize the loginUI
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { wcBalloonDialog } from './wcBalloonDialog.js';
import { wcProgressUI } from './wcProgressUI.js';

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
    status_menu_open: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    progress_menu_open: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    burger_menu_title: { observed: true, accessor: true, type: 'str', value: 'menu', forceAttribute: true, forceInit: true },
    status_menu_title: { observed: true, accessor: true, type: 'str', value: 'status', forceAttribute: true, forceInit: true },
    progress_menu_title: { observed: true, accessor: true, type: 'str', value: 'progress', forceAttribute: true, forceInit: true }
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
    'user-prompt-text-color': { value: 'rgba(240, 240, 240, .8)', global: true },
    'user-prompt-background-color': { value: 'rgba(53, 53, 53, .8)', global: true },
    'user-prompt-warning-color': { value: 'rgb(6, 133, 135)', global: true },
    'user-prompt-warning-text-color': { value: 'rgb(6, 133, 135)', global: true },
    'user-prompt-alert-color': { value: 'rgb(230, 0, 161)', global: true},
    'user-prompt-alert-text-color': { value: 'rgb(230, 0, 161)', global: true}
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
        status_menu_open: (name, oldValue, newValue, slf) => {  if (oldValue != newValue){ slf.openStatusMenu(newValue); } },
        progress_menu_open: (name, oldValue, newValue, slf) => {  if (oldValue != newValue){ slf.openProgressMenu(newValue); } },
        enable_burger_menu: (name,o,n,s) => { s.enableBurgerMenu = n; },
        burger_menu_title: (name,o,n,s) => {
            if (s.initialized && (s.burgerMenu instanceof wcBalloonDialog)){ s.burgerMenu.title = n; }
        },
        status_menu_title: (name,o,n,s) => {
            if (s.initialized && (s.statusMenu instanceof wcBalloonDialog)){ s.statusMenu.title = n; }
        },
        progress_menu_title: (name,o,n,s) => {
            if (s.initialized && (s.statusMenu instanceof wcBalloonDialog)){ s.progressMenu.title = n; }
        }
    };

    this.mergeClassDefaults({
        _enableBurgerMenu: false,
        burgerMenuContent: null
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
    let that = this;
    if (this.initialized && (this.burgerMenu instanceof wcBalloonDialog)){
        if (bool === true){
            this.DOMElement.appendChild(this.burgerMenu);
            that.dispatchEvent(new CustomEvent("open_dialog", { detail: {self: that, dialog_name: 'burger_menu', ui: that.burgerMenu.firstChild }}));
        }else{
            this.burgerMenu.exit();
        }
    }
}




/*
    openStatusMenu(bool)
*/
openStatusMenu(bool){
    let that = this;
    if (this.initialized && (this.statusMenu instanceof wcBalloonDialog)){
        if (bool === true){
            this.shadowDOM.appendChild(this.statusMenu);
            that.dispatchEvent(new CustomEvent("open_dialog", { detail: {self: that, dialog_name: 'status_menu', ui: that.statusMenu.firstChild }}));
        }else{
            this.statusMenu.exit();
        }
    }
}




/*
    openProgressMenu(bool)
*/
openProgressMenu(bool){
    let that = this;
    if (this.initialized && (this.progressMenu instanceof wcBalloonDialog)){
        if (bool === true){
            this.shadowDOM.appendChild(this.progressMenu);
            that.dispatchEvent(new CustomEvent("open_dialog", { detail: {self: that, dialog_name: 'status_menu', ui: that.progressMenu.firstChild }}));
        }else{
            this.progressMenu.exit();
        }
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

    // make the burgerMenu
    this.burgerMenu = new wcBalloonDialog({
        arrow_position: 'topRight',
        alignment_mode: 'topRight',
        title: this.burger_menu_title,
        exitCallback: async (slf) => {
            that.burger_menu_open = false;
            that.dispatchEvent(new CustomEvent("close_dialog", { detail: {self: that, dialog_name: 'burger_menu' }}));
            return(false);
        },
    });
    this.burgerMenu.relativeElement = this._elements.btnBurger;

    // hook for the burger
    that._elements.btnBurger.addEventListener('click', (evt) => { that.burger_menu_open = true; });

    // make the statusMenu
    this.statusMenu = new wcBalloonDialog({
        arrow_position: 'none',
        title: this.status_menu_title,
        exitCallback: async (slf) => {
            that.status_menu_open = false;
            that.dispatchEvent(new CustomEvent("close_dialog", { detail: {self: that, dialog_name: 'status_menu' }}));
            return(false);
        },
    });
    this.statusMenu.relativeElement = this.DOMElement;

    // hook for the status indicator
    that._elements.btnIndicator.addEventListener('click', (evt) => { that.status_menu_open = true; });

    // make the progressMenu
    this.progressMenu = new wcBalloonDialog({
        arrow_position: 'none',
        modal: true,
        title: this.progress_menu_title,
        exitCallback: async (slf) => {
            that.progress_menu_open = false;
            that.dispatchEvent(new CustomEvent("close_dialog", { detail: {self: that, dialog_name: 'progress_menu' }}));
            that.progressUI.percent = 0;
            that.progressUI.title = '';
            that.progressUI.detail = '';
            that.progressUI.additional_detail = '';
            that.progressUI.run_animation = false;
            return(false);
        },
    });
    this.progressMenu.relativeElement = this.DOMElement;
    this.progressUI = new wcProgressUI();
    this.progressUI.setAttribute('slot', 'dialogContent');
    this.progressMenu.appendChild(this.progressUI);

    // yoink the yoinkable slots
    that.yoinkUm();

    // yoink all future yoinkable slot changes
    that.mutationObserver = new MutationObserver((r, slf) => {
        let hasUpdates = false;
        for (const rec of r){ if (rec.type == "childList"){ hasUpdates = true;  } }
        if (hasUpdates){ that.yoinkUm(); }
    });
    that.mutationObserver.observe(that, {
        childList: true,
        subtree: true,
    });

    // send the initialized event
    that.dispatchEvent(new CustomEvent("initialized", { detail: { self: that }}));
}




/*
    yoinkUm()
    descend children and snatch up all the ones with slots and
    doeth thine yoinking here
*/
yoinkUm(){
    let that = this;

    // get burger_menu_content slots
    Array.from(that.children).filter((el) => {return(el.slot == "burger_menu_content")}).forEach((el) => {
        el.setAttribute('slot', 'dialogContent');
        that.burgerMenu.appendChild(el);
        that.burgerMenuContent = el;
    });

    // get status_menu slots
    Array.from(that.children).filter((el) => {return(el.slot == "status_menu_content")}).forEach((el) => {
        el.setAttribute('slot', 'dialogContent');
        that.statusMenu.appendChild(el);
    });
}




/*
    userQuery({
        title: <str>, dialog title
        prompt: <str>, a main prompt
        detail: <str>, detail text paragraph
        options: {<str>:<val>, ...} // es6 default hash key ordering ftw
        type: 'query' (default), 'warning', 'alert'
    })
    display a modal dialog with the specified options.
    each key of 'options' is the textContent of a button which resolves
    the promise with the corresponding value
*/
userQueryOld(args){
    let that = this;
    return(new Promise((toot, boot) => {

        // create the userQuery UI
        let div = document.createElement('div');
        div.className = 'userPrompt';
        div.insertAdjacentHTML('afterbegin', `
            <h2 class="prompt"></h2>
            <p class="detail"></p>
            <div class="buttonContainer"></div>
        `);
        if (args.hasOwnProperty('prompt') && that.isNotNull(args.prompt)){
            div.querySelector('h2.prompt').textContent = args.prompt;
        }else{
            div.querySelector('h2.prompt').remove();
        }

        if (args.hasOwnProperty('detail') && that.isNotNull(args.detail)){
            if (args.detail instanceof Element){
                div.querySelector('p.detail').innerHTML = '';
                div.querySelector('p.detail').appendChild(args.detail);
            }else{
                div.querySelector('p.detail').textContent = args.detail;
            }
        }else{
            div.querySelector('p.detail').remove();
        }
        if (args.options instanceof Object){
            Object.keys(args.options).reverse().map((s) => {
                let btn = document.createElement('button');
                btn.textContent = s;
                btn.addEventListener('click', (evt) => { if (! that.disabled){
                    that.userQueryDilly.exit().then(() =>{
                        toot(args.options[s]);
                    });
                }});
                return(btn);
            }).forEach((el) => { div.querySelector("div.buttonContainer").appendChild(el); })
        }

        // popadilly modal
        that.userQueryDilly = new wcBalloonDialog({
            arrow_position: 'none',
            modal: true,
            title: args.hasOwnProperty('title')?args.title:'',
            exitCallback: async (slf) => {
                delete(this.userQueryDilly);
                that.dispatchEvent(new CustomEvent("close_dialog", { detail: {self: that, dialog_name: 'user_query' }}));
                return(true);
            }
        });
        if (args.hasOwnProperty('type')){
            if (args.type == "warning"){
                that.userQueryDilly.warning = true;
                div.dataset.state = 'warning';
            }else if (args.type == "alert"){
                that.userQueryDilly.alert = true;
                div.dataset.state = 'alert';
            }
        }

        div.setAttribute('slot', 'dialogContent');
        that.userQueryDilly.appendChild(div);
        that.userQueryDilly.relativeElement = that.DOMElement;
        this.shadowDOM.appendChild(this.userQueryDilly);

        // insert css overrides for alert/warning colors
        that.userQueryDilly.addStyleSheet(`
            :host([show_decoration="true"][warning="true"]) div.dialog .body {
                border-color: ${that.styleVar('user-prompt-warning-color')};
            }
            :host([show_decoration="true"][alert="true"]) div.dialog .body {
                border-color: ${that.styleVar('user-prompt-alert-color')};
            }
            :host([alert="true"]) div.dialogHeader {
                background-color: ${that.styleVar('user-prompt-alert-color')};
            }
            :host([warning="true"]) div.dialogHeader {
                background-color: ${that.styleVar('user-prompt-warning-color')};
            }
        `);


        that.dispatchEvent(new CustomEvent("open_dialog", { detail: {self: that, dialog_name: 'user_query', ui: div }}));

    }));
}




/*
    userQuery({
        title: <str>, dialog title
        prompt: <str>, a main prompt
        detail: <str>, detail text paragraph
        options: {<str>:<val>, ...} // es6 default hash key ordering ftw
        type: 'query' (default), 'warning', 'alert'
    })
    display a modal dialog with the specified options.
    each key of 'options' is the textContent of a button which resolves
    the promise with the corresponding value
*/
userQuery(args){
    let that = this;
    return(new Promise((toot, boot) => {

        // create the userQuery UI
        let div = document.createElement('div');
        div.className = 'userPrompt';
        div.insertAdjacentHTML('afterbegin', `
            <h2 class="prompt"></h2>
            <p class="detail"></p>
            <div class="buttonContainer"></div>
        `);
        if (args.hasOwnProperty('prompt') && that.isNotNull(args.prompt)){
            div.querySelector('h2.prompt').textContent = args.prompt;
        }else{
            div.querySelector('h2.prompt').remove();
        }

        if (args.hasOwnProperty('detail') && that.isNotNull(args.detail)){
            if (args.detail instanceof Element){
                div.querySelector('p.detail').innerHTML = '';
                div.querySelector('p.detail').appendChild(args.detail);
            }else{
                div.querySelector('p.detail').textContent = args.detail;
            }
        }else{
            div.querySelector('p.detail').remove();
        }
        if (args.options instanceof Object){
            Object.keys(args.options).reverse().map((s) => {
                let btn = document.createElement('button');
                btn.textContent = s;
                btn.addEventListener('click', (evt) => { if (! that.disabled){
                    that.panelDilly.exit().then(() =>{
                        toot(args.options[s]);
                    });
                }});
                return(btn);
            }).forEach((el) => { div.querySelector("div.buttonContainer").appendChild(el); })
        }

        that.openPanel(
            div,
            args.hasOwnProperty('title')?args.title:'',
            args.hasOwnProperty('type')?args.type:'',
            'user_query'
        );

    }));
}




/*
    openPanel(ui, title, type, ui_name)
    this opens a modal dialog, with all the CSS overrides to integrate
    it into this webComponent, handles dispatching open_dialog events etc
    it's up to you to handle closing the dilly

    title is the text to put in the wcBalloonDialog header
    type is null, warning, or alert

    ui_name is entirely optional, if given we'll pass it to the dialog_name
    on the close_dialog and open_dialog events
*/
openPanel(ui, title, type, ui_name){
    let that = this;
    if (ui instanceof Element){

        // popadilly modal
        that.panelDilly = new wcBalloonDialog({
            arrow_position: 'none',
            modal: true,
            title: that.isNotNull(title)?title:'',
            exitCallback: async (slf) => {
                delete(this.panelDilly);
                that.dispatchEvent(new CustomEvent("close_dialog", { detail: {self: that, dialog_name: that.isNotNull(ui_name)?ui_name:'panel' }}));
                return(true);
            }
        });


        if (that.isNotNull(type)){
            if (type == "warning"){
                that.panelDilly.warning = true;
                ui.dataset.state = 'warning';
            }else if (type == "alert"){
                that.panelDilly.alert = true;
                ui.dataset.state = 'alert';
            }
        }

        ui.setAttribute('slot', 'dialogContent');
        that.panelDilly.appendChild(ui);
        that.panelDilly.relativeElement = that.DOMElement;
        that.shadowDOM.appendChild(that.panelDilly);

        // insert css overrides for alert/warning colors
        that.panelDilly.addStyleSheet(`
            :host([show_decoration="true"][warning="true"]) div.dialog .body {
                border-color: ${that.styleVar('user-prompt-warning-color')};
            }
            :host([show_decoration="true"][alert="true"]) div.dialog .body {
                border-color: ${that.styleVar('user-prompt-alert-color')};
            }
            :host([alert="true"]) div.dialogHeader {
                background-color: ${that.styleVar('user-prompt-alert-color')};
            }
            :host([warning="true"]) div.dialogHeader {
                background-color: ${that.styleVar('user-prompt-warning-color')};
            }
        `);

        that.dispatchEvent(new CustomEvent("open_dialog", { detail: {self: that, dialog_name: that.isNotNull(ui_name)?ui_name:'panel', ui: ui }}));
    }
}




/*
    closePanel()
*/
closePanel(){
    return((this.panelDilly instanceof wcBalloonDialog)?this.panelDilly.exit():Promise.resolve()); 
}




/*
    handleSlotUpdates(r, slf)
    a DOM child was added or removed
    detect if it's one of the slots and handle accordingly
    r is what the MutationObserver callback got
*/
handleSlotUpdates(){
    // placeholder
    console.log('handle slot updates');
}


/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: grid;
        width: 100vw;
        height: 100vh;
        grid-template-rows: ${this.styleVar('header-height')} auto-fill;
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
    div[data-_name="header"] .titleContainer {
       padding: .25em .25em .25em .5em;
       font-size: 1.5rem;
    }
    .mainContainer {
        overflow-y:auto;
        height: 100%;
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
        height: 1.5rem;
        width: 1.5rem;
        margin: .5em;
    }
    button[data-_name="btnBurger"] {
        mask: var(--wc-main-ui-burger-button-mask, url('data:image/svg+xml;utf8,${this.burgerMenuIcon}'));
        background-color: ${this.styleVar('header-color')};
        border: none;
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
    div[data-_name="header"] div[data-_name="btnContainer"] button[data-_name="btnIndicator"][data-status="net-read"] {
        background-color: ${this.styleVar('indicator-net-read-color')};
    }
    div[data-_name="header"] div[data-_name="btnContainer"] button[data-_name="btnIndicator"][data-status="net-write"] {
        background-color: ${this.styleVar('indicator-net-write-color')};
    }
    div[data-_name="header"] div[data-_name="btnContainer"] button[data-_name="btnIndicator"][data-status="db-read"] {
        background-color: ${this.styleVar('indicator-db-read-color')};
    }
    div[data-_name="header"] div[data-_name="btnContainer"] button[data-_name="btnIndicator"][data-status="db-write"] {
        background-color: ${this.styleVar('indicator-db-write-color')};
    }
    .userPrompt[data-state="alert"] {
        color: ${this.styleVar('user-prompt-alert-text-color')};
    }
    .userPrompt[data-state="warning"] {
        color: ${this.styleVar('user-prompt-warning-text-color')};
    }
    .userPrompt {
        padding: .5em;
        color: ${this.styleVar('user-prompt-text-color')};
    }
    .userPrompt .prompt {
        margin: 0;
        font-size: 1em;
    }
    .userPrompt .detail{
        margin: .25em 0 .25em 0;
        font-size: .8em;
    }
    .userPrompt .buttonContainer {
        display: flex;
        flex-direction: row-reverse;
    }
    .userPrompt[data-state="alert"] .buttonContainer button {
        color: ${this.styleVar('user-prompt-alert-text-color')};
        border-color: ${this.styleVar('user-prompt-alert-text-color')};
    }
    .userPrompt[data-state="alert"] .buttonContainer button:active {
        background-color: ${this.styleVar('user-prompt-alert-text-color')};
    }
    .userPrompt[data-state="warning"] .buttonContainer button {
        color: ${this.styleVar('user-prompt-warning-text-color')};
        border-color: ${this.styleVar('user-prompt-warning-text-color')};
    }
    .userPrompt[data-state="warning"] .buttonContainer button:active {
        background-color: ${this.styleVar('user-prompt-warning-text-color')};
    }
    .userPrompt .buttonContainer button {
        background-color: transparent;
        border-radius: 1em;
        color: ${this.styleVar('user-prompt-text-color')};
        border: .128em solid ${this.styleVar('user-prompt-text-color')};
        margin: .25em;
        padding: .25em .66em .25em .66em;
    }
    .userPrompt .buttonContainer button:active {
        color: ${this.styleVar('user-prompt-background-color')};
        background-color: ${this.styleVar('user-prompt-text-color')};
    }
`)}




/*
    burgerMenuIcon
*/
get burgerMenuIcon(){return(encodeURIComponent(`<svg
    version="1.1"
    viewBox="0 -256 1792 1792"
    id="svg1173"
    sodipodi:docname="burger.svg"
    inkscape:version="1.3.2 (091e20ef0f, 2023-11-25)"
    xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
    xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:cc="http://creativecommons.org/ns#"
    xmlns:dc="http://purl.org/dc/elements/1.1/">
   <metadata
      id="metadata1179">
     <rdf:RDF>
       <cc:Work
          rdf:about="">
         <dc:format>image/svg+xml</dc:format>
         <dc:type
            rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
       </cc:Work>
     </rdf:RDF>
   </metadata>
   <defs
      id="defs1177">
     <clipPath
        clipPathUnits="userSpaceOnUse"
        id="clipPath4548">
       <path
          id="lpe_path-effect4552"
          style="fill:#fcbf18;fill-opacity:1;stroke:none;stroke-width:0.444235;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;paint-order:markers stroke fill"
          class="powerclip"
          d="m 173.261,112.49401 h 22.08005 v 22.08004 H 173.261 Z m 10.53514,6.40981 c -0.45317,0 -0.81803,0.36487 -0.81803,0.81804 v 2.48925 h -2.48926 c -0.45317,0 -0.81803,0.36487 -0.81803,0.81804 v 1.00976 c 0,0.45317 0.36486,0.81803 0.81803,0.81803 h 2.48926 v 2.48926 c 0,0.45317 0.36486,0.81803 0.81803,0.81803 h 1.01028 c 0.45317,0 0.81752,-0.36486 0.81752,-0.81803 v -2.48926 h 2.48977 c 0.45317,0 0.81752,-0.36486 0.81752,-0.81803 v -1.00976 c 0,-0.45317 -0.36435,-0.81804 -0.81752,-0.81804 h -2.48977 v -2.48925 c 0,-0.45317 -0.36435,-0.81804 -0.81752,-0.81804 z" />
     </clipPath>
   </defs>
   <sodipodi:namedview
      pagecolor="#ffffff"
      bordercolor="#666666"
      borderopacity="1"
      objecttolerance="10"
      gridtolerance="10"
      guidetolerance="10"
      inkscape:pageopacity="0"
      inkscape:pageshadow="2"
      inkscape:window-width="1920"
      inkscape:window-height="1095"
      id="namedview1175"
      showgrid="false"
      inkscape:zoom="0.37849334"
      inkscape:cx="834.8892"
      inkscape:cy="836.21022"
      inkscape:window-x="0"
      inkscape:window-y="0"
      inkscape:window-maximized="1"
      inkscape:current-layer="svg1173"
      inkscape:showpageshadow="0"
      inkscape:pagecheckerboard="0"
      inkscape:deskcolor="#505050" />
   <g
      id="g17144"
      transform="matrix(108.8504,0,0,108.8504,-16846.174,-12756.23)">
     <path
        style="fill:#bfbf18;fill-opacity:1;stroke:#bfbf18;stroke-width:1.43251;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="m 158.57304,119.77188 8.84581,-0.006"
        id="path1457" />
     <path
        style="fill:#bfbf18;fill-opacity:1;stroke:#bfbf18;stroke-width:1.43251;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="m 158.57304,123.25684 8.84581,-0.006"
        id="path1457-3" />
     <path
        style="fill:#bfbf18;fill-opacity:1;stroke:#bfbf18;stroke-width:1.43251;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="m 158.57304,126.74179 8.84581,-0.006"
        id="path1457-6" />
   </g>
</svg>`))}



} // end class
const _classRegistration = wcMainUI.registerElement('wc-main-ui');
export { _classRegistration as wcMainUI };
