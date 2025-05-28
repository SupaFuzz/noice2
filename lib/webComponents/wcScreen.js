/*
    wcScreen.js
    this is an extension of wcBasic that implements some extra properties:

    inherited properties:
        * content (HTML string)
        * styleSheet (CSS string)
        * initializedCallback (slf) => { ... }

    new properties:
        * [done] name (string)
        * [done] menu_order (float)
        * [done] menu_label (string)
        * [done] has_focus (bool)
        * [done] fit_parent
        * menu_icon_mask (CSS mask: value)

    new functions:
        * [done] setFocus async (focusBool, focusArgs, slf) => { ... }

    slots:
        * [done] content (use this to emulate the 'content' arg on )

    events:
        * [done] gain_focus
        * [done] lose_focus
        * [done] focus_error
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { wcBasic } from './wcBasic.js';

class wcScreen extends wcBasic {

static classID = wcScreen;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    has_focus: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    fit_parent: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    name: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_label: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_order: { observed: true, accessor: true, type: 'float', value: '0', forceAttribute: true, forceInit: true }
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(args){
    super(args);
    this._className = 'wcScreen';
    this._version = 1;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        name: (a,o,n,s) => { s.setName(n); },
        menu_label: (a,o,n,s) => { s.setMenuLabel(n); },
        menu_order: (a,o,n,s) => { s.setMenuOrder(n); },

        /*
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };

    // merge object defaults
    this.mergeClassDefaults({
        _content: null,
        _menu_icon_mask: null
    });
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){ return(wcScreen.classAttributeDefaults); }
getStyleDefaults(){ return(wcScreen.classStyleDefaults); }




/*
    for reasons of laziness and compatibility with wcScreenHolder.js
    these attributes need to be echoed onto the element.dataset
*/
setName(name){ this.dataset.name = name; }
setMenuLabel(label){ this.dataset.menu_label = label; }
setMenuOrder(order){ this.dataset.menu_order = order; }




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: grid;
        place-content: baseline;
    }
    :host([fit-parent="true"]){
        height: 100%;
    }
`)};




/*
    setFocus(focusBool, focusArgs, slf)
    this is the central, guaranteed-to-exist setFocus function.
    you can override this in your subclasses directly or just
    setup gainFocusCallback() and loseFocusCallback() functions
    which this function here will respect for you automatically
*/
setFocus(focusBool, focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {
        if ((focusBool == true) && (that.gainFocusCallback instanceof Function)){

            that.gainFocusCallback(focusArgs, that).then((resp) => {
                // dispatch gain_focus event
                that.dispatchEvent(new CustomEvent("gain_focus", { detail: { focus: true, screen: that, focusReturnArgs: resp }}));
                that.has_focus = true;
                toot(resp);
            }).catch((error) => {
                // dispatch focus_error event
                that.dispatchEvent(new CustomEvent("focus_error", { detail: { focus: true, screen: that, focusReturnArgs: resp }}));
                boot(error);
            });

        }else if ((focusBool == false) && (that.loseFocusCallback instanceof Function)){

            that.gainFocusCallback(focusArgs, that).then((resp) => {
                // dispatch lose_focus event
                that.dispatchEvent(new CustomEvent("lose_focus", { detail: { focus: false, screen: that, focusReturnArgs: resp }}));
                that.has_focus = false;
                toot(resp);
            }).catch((error) => {
                // dispatch focus_error event
                that.dispatchEvent(new CustomEvent("focus_error", { detail: { focus: false, screen: that, focusReturnArgs: resp }}));
                boot(error);
            });

        }else{
            that.has_focus = (focusBool === true);
            that.dispatchEvent(new CustomEvent(that.has_focus?"gain_focus":"lose_focus", { detail: { focus: that.has_focus, screen: that, focusReturnArgs: null }}));
            toot(true);
        }
    }));
}




/*
    menu_icon_mask stuff
    override these with
*/
get menu_icon_mask(){ return(this._menu_icon_mask); }
set menu_icon_mask(v){ this._menu_icon_mask = v; }



}
const _classRegistration = wcScreen.registerElement('wc-screen');
export { _classRegistration as wcScreen };
