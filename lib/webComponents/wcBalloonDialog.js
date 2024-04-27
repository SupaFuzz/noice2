/*
    wcBalloonDialog.js
    4/25/24 Amy Hicox <amy@hicox.com>

    this is a reimplementation of noiceBalloonDialog as a webComponent

    css vars:
        --wc-balloon-dialog-body-border:            1px solid rgb(191, 191, 24);
        --wc-balloon-dialog-body-background-color:  rgb(191, 191, 24)
        --wc-balloon-dialog-body-radius:            .25em;
        --wc-balloon-dialog-header-text-color:      rgba(30, 32, 33, 66);
        --wc-balloon-dialog-body-background-color:  rgb(30, 32, 33);
    events:
        set_position:   {self: this}    either the root element has been inserted into a document object
                                        and connectedCallback() has fired or an orientationChange event
                                        has fired, or a resize event has fired

*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcBalloonDialog extends noiceAutonomousCustomElement {




static classID = wcBalloonDialog;
static classAttributeDefaults = {
    arrow_position: {  observed: true, accessor: true, type: 'enum', values:['none', 'top', 'right', 'bottom', 'left'], value: 'none', forceAttribute: true },
    arrow_offset: { observed: true, accessor: true, type: 'str', value: '21px', forceAttribute: true },
    arrow_size: { observed: true, accessor: true, type: 'str', value: '10px', forceAttribute: true },
    max_height: { observed: true, accessor: true, type: 'str', value: '66vh' },
    x: { observed: true, accessor: true, type: 'str', value: 0, forceAttribute: true },
    y: { observed: true, accessor: true, type: 'str', value: 0, forceAttribute: true },
    z: { observed: true, accessor: true, type: 'int', value: 9, forceAttribute: true },
    modal: { observed: true, accessor: true, type: 'bool', value: false },
    title: { observed: true, accessor: true, type: 'str', value: '' },

    // done
    enable_positioning_listeners: { observed: true, accessor: true, type: 'bool', value: false }

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
    this._className = 'wcBalloonDialog';
    this._version = 1;
    this._hasSetPositionCallback = false;
    this._listeners = {};
    this._elements = {};
    //this._dialogContent = null;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        enable_positioning_listeners: (name, o, n, s) => { this.togglePositionListeners(n, s); }

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
    return(wcBalloonDialog.classAttributeDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.classList.add('dialog');
    div.insertAdjacentHTML('afterbegin',
        `<div class="body">
            <div class="dialogHeader">
                <span class="title">${this.title}</span>
                <div class='headerContent'></div>
            </div>
            <div class='dialogContent'></div>
        </div>`
    );
    this._elements.dialogContent = div.querySelector('div.body div.dialogContent');
    this._elements.headerContent = div.querySelector('div.dialogHeader div.headerContent');
    this._elements.title = div.querySelector('span.title');
    return(div);
}




/*
    headerContent
*/
get headerContent(){ return((this.initialized)?this.querySelector('div.dialogHeader div.headerContent'):this._headerContent); }
set headerContent(v){
    if (this.initialized){
        if (v instanceof Element){
            this._elements.headerContent.innerHTML = '';
            this._elements.headerContent.appendChild(v)
        }else{
            this._elements.headerContent.textContent = `${v}`;
        }
    }else{
        this._heeaderContent = v;
    }
}




/*
    dialogContent
*/
get dialogContent(){ return((this.initialized)?this.querySelector('div.body div.dialogContent'):this._dialogContent); }
set dialogContent(v){
    if (this.initialized){
        if (v instanceof Element){
            this._elements.dialogContent.innerHTML = '';
            this._elements.dialogContent.appendChild(v)
        }else{
            this._elements.dialogContent.textContent = `${v}`;
        }
    }else{
        this._dialogContent = v;
    }
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        position: absolute;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        left: 0px;
        top: 0px;
        z-index: ${this.z};
    }
    :host > * {
        cursor: default;
    }
    div.dialog {
        display: grid;
        grid-template-columns: 1fr;
        place-items: center;
        font-size: 1em;
        position: absolute;
        top: ${this.y};
        left: ${this.x};
    }
    div.dialog .body {
        overflow: auto;
        border-left: var(--wc-balloon-dialog-body-border, 1px solid rgb(191, 191, 24));
        border-right: var(--wc-balloon-dialog-body-border, 1px solid rgb(191, 191, 24));
        border-bottom: var(--wc-balloon-dialog-body-border, 1px solid rgb(191, 191, 24));
        background-color: var(--wc-balloon-dialog-body-background-color, rgb(191, 191, 24));
        border-radius: var(--wc-balloon-dialog-body-radius, .25em);
    }
    div.dialogHeader {
        display: grid;
        grid-template-columns: auto 5em;
        width: 100%;
        border-color: transparent;
        border-width: 0;
        background-color: var(--wc-balloon-dialog-body-background-color, rgb(191, 191, 24));
        border: 0px;
    }
    span.dialogHeaderTitle {
        align-self: center;
        font-size: .66em;
        padding: .25em .75em .25em .75em;
        text-align: left;
        color: var(--wc-balloon-dialog-header-text-color, rgba(30, 32, 33, 66));
    }
    div.dialogContent {
        width: auto;
        height: auto;
        background-color: var(--wc-balloon-dialog-body-background-color, rgb(30, 32, 33));
        overflow-x: hidden;
        overflow-y: auto;
        max-height: ${this.max_height};
    }


    :host([arrow_position="top"]) .dialog:after {
        content: '';
        position: absolute;
        top: -${this.arrow_size};
        right: ${this.arrow_offset};
        width: 0;
        height: 0;
        border: ${this.arrow_size} solid transparent;
        border-bottom-color: var(--wc-balloon-dialog-body-background-color, rgb(191, 191, 24));
        border-top: 0;
        margin-left: -${this.arrow_size};
        margin-bottom: -${this.arrow_size};
    }



`)};




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    if (! this.initialized){ this.initialize(); }

    // init listeners
    this.enable_positioning_listeners = this.enable_positioning_listeners;
    this.dialogContent = this._dialogContent;
}




/*
    connectedCallback()
    the root element has been inserted into a document object
*/
connectedCallback(){
    if (! this.initialized){ this.initialize(); }
    this.setPosition();
}




/*
    setPosition()
    either the root element has been inserted into a document object and connectedCallback() has fired
    or an orientationChange event has fired, or a resize event has fired

    if a setPositionCallback has been registered, we will fire the set_position event
    which should securely invoke it.

    otherwise we'll just fire the coordinate attribute setters
*/
setPosition(){
    if (this._hasSetPositionCallback){
        this.dispatchEvent(new CustomEvent("set_position", {detail: {
            self: this
        }}));
    }else{
        // the cheek!
        ['x', 'y', 'z'].forEach((c) => { this[c] = this[c]; }, this);
    }
}




/*
    setPositionCallback attribute setter
*/
set setPositionCallback(f){
    if (f instanceof Function){
        this.addEventListener('set_position', (evt) => { f(evt.detail.self); });
        this._hasSetPositionCallback = true;
    }
}




/*
    togglePositionListeners(enableBool, selfRef)
    toggle the positioning listeners
*/
togglePositionListeners(enableBool, selfRef){
    if (this.initialized){
        if (enableBool === true){

            // make 'em
            let that = this;
            let orientationChangeEvent = (screen && screen.orientation)?'change':'orientationchange';

            if (! (that._listeners[orientationChangeEvent] instanceof Function)){
                that._listeners[orientationChangeEvent] = that.getEventListenerWrapper((evt, selfReference) => {

                    if (orientationChangeEvent == 'change'){
                        /*
                            7/6/22
                            NOTE: on windows tablet chrome/edge at least,
                            the setTimeout is a brute-force way to wait until
                            screen.orientation/change has completed. There ought
                            to be a better way than this but it's the best I can
                            figure at the moment
                        */
                        setTimeout(function(){ that.setPosition(); }, 100);
                    }else{
                        that.setPosition();
                    }
                });
                if (orientationChangeEvent == 'change'){
                    screen.orientation.addEventListener('change', that._listeners[orientationChangeEvent]);
                }else{
                    window.addEventListener('orientationchange', that._listeners[orientationChangeEvent]);
                }
            }

            if (! (that._listeners.resize instanceof Function)){
                that._listeners.resize = that.getEventListenerWrapper((evt, selfReference) => { that.setPosition(); });
                window.addEventListener('resize', that._listeners.resize);
            }

        }else{
            // delete 'em
            Object.keys(this._listeners).forEach((eventName) => {
                window.removeEventListener(eventName, this._listeners[eventName]);
                delete(this._listeners[eventName]);
            }, this);
        }
    }
}





}
export { wcBalloonDialog };
