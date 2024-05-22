/*
    wcBasic.js
    Amy Hicox 5/21/24

    this is an extension of noiceAutonomousCustomElement where you can do like this:

    new wcBasic({
        content: <string || Element>,
        styleSheet:   <string || Style Element>,
        .. other attributes, I'm sure ..
    })

    content is the HTML content of the webComponent which is appended to this.shadowDOM
    if a string, will be parsed for HTML content and the resulting DOMTree will be used

    Element children of content tagged with .dataset._name will be pulled into ._elements
    (see wcUtils.pullElementReferences). Object accessors will be setup for each of these
    getting gets the .textContent, setting sets the .textContent if a string else if
    Element, empty/replace with

    style can be an Element.style object or a string to parse into one. This stylesheet
    will be inserted into the shadowDOM. Will delete previous style before setting
    (one stylesheet at a time)
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcBasic extends noiceAutonomousCustomElement {




static classID = wcBasic;
static classAttributeDefaults = {
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
    this._className = 'wcBasic';
    this._version = 1;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
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
    return(wcBasic.classAttributeDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;

    /*
        insert shenanigans here
        also set this._elements references if needed
        also setup default event listeners if needed
    */

    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    /*
        doeth thine settting up things here
    */
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
    }
`)};


}
export { wcBasic };
