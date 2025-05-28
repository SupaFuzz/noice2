/*
    customScreenExample.js
    demonstrates how to extend wcScreen.js for a full-fledged ui component
*/
import { wcScreen } from '../../lib/webComponents/wcScreen.js';
class customScreenExample extends wcScreen {




static classID = customScreenExample;
static classAttributeDefaults = {
    // needed boilerplate (it is what it is)
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    has_focus: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    fit_parent: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    name: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_label: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_order: { observed: true, accessor: true, type: 'float', value: '0', forceAttribute: true, forceInit: true }

    // add custom element attributes here if needed
};

// also boilerplate
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });






}
const _classRegistration = customScreenExample.registerElement('custom-screen-example');
export { _classRegistration as customScreenExample };
