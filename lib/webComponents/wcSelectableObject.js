/*
    wcSelectableObject.js
    8/15/24 Amy Hicox <amy@hicox.com>
    your standard iOS style toggler

    [()   ] <label>
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcSelectableObject extends noiceAutonomousCustomElement {

static classID = wcSelectableObject;
static classAttributeDefaults = {
    selected: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    //content: { observer: true, accessor: true, type: 'elementAttribute', value: '' }
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'selected-background-color': { value: 'rgba(240, 240, 240, .5)', global: true },
    'background-color': { value: 'transparent', global: true },
    // add more later. don't forget about disabled too
}




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcSelectableObject';
    this._version = 1;
    this.cssVarPrefix = '--wc-selectable';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcSelectableObject.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcSelectableObject.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcSelectableObject.classStyleDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    /*
        OKAAAAYYYY! and templating without a <template>
        based on the element content is just that easy?!
        w00t!

        LOH 8/22/24 @ 1613
        ok, now we know how to wrap element content
        we'll need to embed css for the POMenuItems or whatever
        but I actually think that's fine to put in the global scope

        next up we need to flesh this out with the select callbacks
        n stuff. Play around with it, see what the most sane way
        to do this might be

        I'm afraid of making too light weight of a wrapper and just
        building a brand new precious class dependent mess.

        very cool to figure out how to do slots though. I like that alot
    */

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.insertAdjacentHTML('afterbegin', `
        <div data-_name="content"><slot name="thang"></slot></div>
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


    this.addEventListener('click', (evt) => {
        that.selected = (! that.selected);
    });

    /* TODO: mutate this to be the click handler for select
    this._elements.knob.addEventListener('click', (evt) => {
        if (! that.disabled){
            that.on = (! (that.on == true));
            that.dispatchEvent(new CustomEvent("capture_value", { detail: {
                value: that.on,
                self: that
            }}));
        }
    });
    */
}




/*
    TODO: mutate this to be selectCallback
    captureValueCallback setter
set captureValueCallback(f){
    if (f instanceof Function){
        this.addEventListener('capture_value', (evt) => { f(evt.detail.value, evt.detail.self); });
    }
}
*/




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
        background-color: ${this.styleVar('background-color')};
    }
    :host([disabled="true"]){
        opacity: .5;
        filter: grayscale(.9);
    }
    :host([selected="true"]) {
        background-color: ${this.styleVar('selected-background-color')};
    }
`)};



}
const _classRegistration = wcSelectableObject.registerElement('wc-selectable-object');
export { _classRegistration as wcSelectableObject };
