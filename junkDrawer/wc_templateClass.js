/*
    wpFormElement.js
    4/12/24 Amy Hicox <amy@hicox.com>

    this implements a base class for a webComponent version
    of a noiceCoreUIFormElement basically.

    to-do:
        * everything
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { isNull, isNotNull } from '../noiceCore.js';

class wpFormElement extends noiceAutonomousCustomElement {




static classID = 'wpFormElement';

static classAttributeDefaults = {
}

// observedAttributes
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(){
    super();
    this._className = 'wpPieChart';
    this._version = 1;
    this._initialized = false;
    this._charts = {};

    // we have to make a hard copy of the classAttributeDefaults to use as our local copy
    this.attributeDefaults = JSON.parse(JSON.stringify(wpFormElement.classAttributeDefaults));

    // spawn the attribute accessors
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        //size:  (name, oldValue, newValue, slf) => { slf.setSize(newValue); },
    }
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;

    /*
        inserteth thine UI stuffs here
        ye verily
    */

    return(div);
}




/*
    style getter
*/
get style(){return(`
    /* insert scoped CSS here */
`)}




/*
    ----------------------------------------------------------------------
    attributeChangeHandler functions go down here
    ----------------------------------------------------------------------
*/



}
export { wpFormElement };
