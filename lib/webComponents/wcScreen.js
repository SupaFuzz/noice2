/*
    wcScreen.js
    this is an extension of wcBasic that implements some extra properties:

    inherited properties:
        * content (HTML string)
        * styleSheet (CSS string)
        * initializedCallback (slf) => { ... }

    new properties:
        * name (string)
        * menu_order (float)
        * menu_label (string)
        * menu_icon_mask (CSS mask: value)
        * has_focus (bool)
    new functions:

        * setFocus async (focusBool, focusArgs, slf) => { ... }

    slots:
        * menu_icon (some yoinkin' magic gonna go here no doubt)
        * content (use this to emulate the 'content' arg on )

    events:
        * gain_focus (slf)
        * lose_focus (slf)
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { wcBasic } from './wcBasic.js';

class wcScreen extends wcBasic {

static classID = wcScreen;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    has_focus: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    fit_parent: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    name: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true },
    menu_label: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true },
    menu_order: { observed: true, accessor: true, type: 'float', value: '0', forceAttribute: true }
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
        /*
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };

    // merge object defaults
    this.mergeClassDefaults({
        _content: null
    });
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){ return(wcScreen.classAttributeDefaults); }
getStyleDefaults(){ return(wcScreen.classStyleDefaults); }




}
const _classRegistration = wcScreen.registerElement('wc-screen');
export { _classRegistration as wcScreen };
