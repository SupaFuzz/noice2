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
import { wcBasic } from './wcBasic.js';
import { epochTimestamp, getGUID } from '../noiceCore.js';

class wcScreenHolder extends noiceAutonomousCustomElement {

static classID = wcScreenHolder;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    full_screen: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true }
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'background': { value: 'transparent', global: true },
    'menu-button-size': { value: '1.15em', global: true },
    'menu-button-color': { value: 'inherit', global: true },
    'menu-button-background-color': { value: 'transparent', global: true },
    'menu-button-border-color': { value: 'transparent', global: true },
    'menu-button-font-family': { value: 'Comfortaa', global: true },
    'menu-button-font-size': { value: '1.5rem', global: true },
    'menu-button-hover-color': { value: 'rgba(240,240,240,.3)', global: true },
    'menu-button-hover-background-color': { value: 'rgba(53,53,53,.8)', global: true },
    'menu-button-hover-border-color': { value: 'rgba(240,240,240,.3)', global: true },
    'menu-button-select-color': { value: 'rgba(53,53,53,.8)', global: true },
    'menu-button-select-background-color': { value: 'rgba(240,240,240,.3)', global: true },
    'menu-button-select-border-color': { value: 'rgba(53,53,53,.8)', global: true },
    'menu-button-width': { value: '100%', global: true }
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

        // setup a listener to check for added/removed children that are on a slot
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
            (el.slot == "screen") && (
                (el.dataset && el.dataset.name && that.isNotNull(el.dataset.name)) ||
                that.isNotNull(el.getAttribute('name'))
            )
        )}).map((el) => {
            el.remove();
            return(that.addUI(el,
                (el.dataset && el.dataset.name && that.isNotNull(el.dataset.name))?el.dataset.name:(that.isNotNull(el.getAttribute('name')))?el.getAttribute('name'):getGUID()
            ))
        })
    ));
}




/*
    addUI(screen, screenName)
    add the given element as a UI with the given screenName

    supports some stuff:

        * async addUICallback(screen, screenName, this)
        * ui_added event

    NOTE: 5/27/25 @ 1605 -- COB
    brain is absolutely fried from the ordeal of the last 5 days
    also i gotta go pick him up at work in like 20 minutes

    anyhow. see wcScreen.js -- though we can take any element
    with the right attributes, that should be what we're expecting
    which means we need to move these attributes out of the dataset and
    just put 'em on as direct object attributes.

*/
addUI(screen, screenName){
    let that = this;
    return(new Promise((toot, boot) => {
        new Promise((t) => {t(
            (that.addUICallback instanceof Function)?that.addUICallback(screen, screenName, that):screen
        )}).then((screen_override) => {
            that.UIs[screenName] = screen_override;



            // default values for menu_order and menu_label
            if (! screen.dataset.menu_order){ screen.dataset.menu_order = that.isNotNull(screen.getAttribute('menu_order'))?screen.getAttribute('menu_order'):epochTimestamp(true); }
            if (! screen.dataset.menu_label){ screen.dataset.menu_label = that.isNotNull(screen.getAttribute('menu_label'))?screen.getAttribute('menu_label'):screenName; }
            if (! screen.dataset.name){ screen.dataset.name = screenName; }

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
                    that.DOMElement.appendChild(el);
                    that.dispatchEvent(new CustomEvent("ui_focus", { detail: {focus: true, self: that, screenName: screenName, screen: that.UIs[screenName] }}));
                    that.currentUI = el;
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
    getUIMenu()
    might wanna extend this to take an object input to merge into the
    menu items ... maybe ... anyhoo ...
*/
getUIMenu(){
    let that = this;



    return(new wcBasic({
        content: '<div data-_name="menu"></div>',
        initializedCallback: (slf) => {

                slf.generateMenu = () => {
                    let selectedUIName = ((that.currentUI instanceof Element) && (that.currentUI.dataset.name))?that.currentUI.dataset.name:((that.currentUI instanceof Element) && that.isNotNull(that.curretUI.getAttribute('name')))?that.curretUI.getAttribute('name'):null;

                    // generate the buttons
                    slf._elements.menu.innerHTML = Object.keys(that.UIs).map((a) => {return(that.UIs[a])}).sort((a,b) => {return(
                        parseFloat(a.dataset.menu_order) - parseFloat(b.dataset.menu_order)
                    )}).map((el) => {return(
                         `<button class="menuBtn" data-_name="${el.dataset.name}" data-selected="${(that.isNotNull(selectedUIName) && (selectedUIName == el.dataset.name))}">${el.dataset.menu_label}</button>`
                    )}).join("");

                    // hook up the buttons to switchUI()
                    slf._elements.menu.querySelectorAll('button').forEach((el) => {
                        el.addEventListener("click", (evt) => {
                            window.uiHolder.switchUI((el.dataset.selected == "true")?null:el.dataset._name).then(() => {

                                // deselect others
                                Array.from(slf._elements.menu.querySelectorAll('button')).filter((ell) => {return(
                                    ell.className == "menuBtn" &&
                                    (ell.dataset._name != el.dataset._name)
                                )}).forEach((ell) => {ell.dataset.selected = "false"; });

                                // select self
                                el.dataset.selected = (el.dataset.selected == "true")?"false":"true";

                            });
                        });
                    });

                    // update the css
                    let btn_icons = Object.keys(that.UIs).map((a) => {return(that.UIs[a])}).filter((a) => {return(
                        //a.hasOwnProperty('menu_icon_mask') &&
                        that.isNotNull(a.menu_icon_mask)
                    )}).map((el) => {return(`
                        button[data-_name="${el.dataset.name}"]:after{
                            content: '\\00a0';
                            display: inline-block;
                            width: ${this.styleVar('menu-button-size')};
                            height: ${this.styleVar('menu-button-size')};
                            background-color: ${this.styleVar('menu-button-color')};
                            margin-left: .15em;
                            mask: ${el.menu_icon_mask};
                            mask-size: contain;
                            mask-repeat: no-repeat;
                        }
                    `)}).join("");
                    slf.styleSheet = `
                        div[data-_name="menu"] {
                            display: grid;
                            overflow: auto;
                        }
                        button {
                            color: ${this.styleVar('menu-button-color')};
                            background-color: ${this.styleVar('menu-button-background-color')};
                            border-color: ${this.styleVar('menu-button-border-color')};
                            text-align: right;
                            font-size: ${this.styleVar('menu-button-font-size')};
                            font-family: ${this.styleVar('menu-button-font-family')};
                            width: ${this.styleVar('menu-button-width')};

                        }
                        button:hover {
                            color: ${this.styleVar('menu-button-hover-color')};
                            background-color: ${this.styleVar('menu-button-hover-background-color')};
                            border-color: ${this.styleVar('menu-button-hover-border-color')};
                        }
                        button[data-selected="true"]{
                            color: ${this.styleVar('menu-button-select-color')};
                            background-color: ${this.styleVar('menu-button-select-background-color')};
                            border-color: ${this.styleVar('menu-button-select-border-color')};
                        }
                        ${btn_icons}
                    `;
                };

                // render it
                slf.generateMenu();

                // listen for ui_added event and update menu content appropriately
                that.addEventListener('ui_added', (evt) => { slf.generateMenu(); })
            }
    }))
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
    :host([full_screen="true"]){
        width: 100vh;
        height: 100vh;
        position: absolute;
    }
`)}




} // end class
const _classRegistration = wcScreenHolder.registerElement('wc-screen-holder');
export { _classRegistration as wcScreenHolder };
