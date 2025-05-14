/*
    wcScreenHolder.js
    5/12/25 Amy Hicox <amy@hicox.com>

    like noiceCoreUIScreenHolder but a webComponent.
    at the end of the day, this implements a <div>
    which will either float over the entirety of it's
    parent, obscuring it, or the entire viewPort.

    into that <div> we will place one element (and it's)
    tree at a time. These will be on the 'screen' slot

    need to figure out how we want to handle the 'focus'
    callbacks -- app-level functions in the DOM seem like
    bad juju to me. Doing it with like echo/response event types
    might work.
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcScreenHolder extends noiceAutonomousCustomElement {

static classID = wcScreenHolder;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    full_screen: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true }
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'background': { value: 'transparent', global: true }
};




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcScreenHolder';
    this._version = 1;
    this.cssVarPrefix = '--wc-screen-holder';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcScreenHolder.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    this.attributeChangeHandlers = {
        disabled:  (name, oldValue, newValue, slf) => { if (oldValue != newValue){
            // do slf.something(), maybe
        }}
    };

    // init private attributes
    this.mergeClassDefaults({
        UIs: {},
        currentUI: null
    });;

}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcScreenHolder.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcScreenHolder.classStyleDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){
    let div = document.createElement('div');
    div.className = this._className;
    div.insertAdjacentHTML('afterbegin', `<slot name="screen"></slot>`);
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

    // yoink all the screens and await callbacks if there are any
    that.yoinkUm().then(() => {

        // send the initialized event
        that.dispatchEvent(new CustomEvent("initialized", { detail: { self: that }}));

    });

}




/*
    yoinkUm()
    descend children and snatch up all the ones where slot="screen" and the dataset.name attribute is set
    push them into this.UIs indexed by dataset.name
    and remove them from the DOM

    separated this out here from initializedCallback(), because I suspect there's a way we can get an
    event that fires when child elements are added and to have it automatically pick up DOM tree mods
    would be the beezkneez
*/
yoinkUm(){
    let that = this;
    return(Promise.all(
        Array.from(that.children).filter((el) => {return(
            (el.slot == "screen") &&
            el.dataset &&
            el.dataset.name &&
            that.isNotNull(el.dataset.name)
        )}).map((el) => {
            el.remove();
            return(that.addUI(el, el.dataset.name))
        })
    ));
}




/*
    addUI(screen, screenName)
    add the given element as a UI with the given screenName

    supports some stuff:

        * async addUICallback(screen, screenName, this)
        * ui_added event
*/
addUI(screen, screenName){
    let that = this;
    return(new Promise((toot, boot) => {
        new Promise((t) => {t(
            (that.addUICallback instanceof Function)?that.addUICallback(screen, screenName, that):screen
        )}).then((screen_override) => {
            that.UIs[screenName] = screen_override;
            that.dispatchEvent(new CustomEvent("ui_added", { detail: {self: that, screenName: screenName, screen: that.UIs[screenName] }}));
            toot(that.UIs[screenName]);
        }).catch((error) => {
            boot(error);
        });
    }));
}




/*
    getUI(uiName)
*/
getUI(uiName){return(
    (this.isNotNull(uiName) && this.UIs.hasOwnProperty(uiName))?this.UIs[uiName]:null
)}




/*
    changeUIName(oldName, newName)
*/
changeUIName(oldName, newName){
    if (
        this.isNotNull(oldName) &&
        this.UIs.hasOwnProperty(oldName) &&
        this.isNotNull(newName) &&
        (newName !== oldName)
    ){
        this.UIs[newName] = this.UIs[oldName];
        delete(this.UIs[oldName]);
    }
}




/*
    removeUI(uiName)
    for when you really mean it
*/
removeUI(uiName){
    if (
        this.isNotNull(uiName) &&
        (this.UIs[uiName] instanceof Element)
    ){
        this.UIs[uiName].remove();
        delete(this.UIs[uiName]);
    }
}




/*
    switchUI(screenName, focusArgs)
    like we always do 'bout this time ...

    supports:

        * async setFocus() [on screen slots]
        * ui_focus event
*/
switchUI(screenName, focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // await lose focus on the current occupant if we have one and they have a setFocus() function
        new Promise((_t) =>{_t(
            (that.currentUI instanceof Element)?(that.currentUI.setFocus instanceof Function)?that.currentUI.setFocus(false, focusArgs):that.currentUI:null
        )}).then((el) => {
            if (el instanceof Element){
                el.remove();
                that.dispatchEvent(new CustomEvent("ui_focus", { detail: {focus: false, self: that, screenName: el.dataset.name, screen: el }}));
            }

            // give focus to the new one
            new Promise((_t) =>{_t(
                (that.UIs[screenName] instanceof Element)?(that.UIs[screenName].setFocus instanceof Function)?that.UIs[screenName].setFocus(true, focusArgs):that.UIs[screenName]:null
            )}).then((el) => {
                if (el instanceof Element){
                    this.DOMElement.appendChild(el);
                    that.dispatchEvent(new CustomEvent("ui_focus", { detail: {focus: true, self: that, screenName: screenName, screen: that.UIs[screenName] }}));
                    toot(el);
                }else{
                    console.debug(`${that._className} v${that._version} | switchUI(${screenName}) | screenName somehow unknown?`);
                    toot(null);
                }
            }).catch((error) => {

            });
        }).catch((error) => {
            console.debug(`${that._className} v${that._version} | switchUI(${screenName}) | currentUI.setFocus(false) threw aborting UI change: ${error}`);
            boot(error);
        });

    }));
}




/*
    listUIs()
*/
listUIs(){
    return(this.UIs);
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: grid;
        width: 100%;
        height: 100%;
        overflow: hidden;
        top: 0;
        left: 0;
        position: relative;
        background: ${this.styleVar('background')};
    }
    :host[full_screen="true"]{
        width: 100vh;
        height: 100vh;
        position: absolute;
    }
`)}




} // end class
const _classRegistration = wcScreenHolder.registerElement('wc-screen-holder');
export { _classRegistration as wcScreenHolder };
