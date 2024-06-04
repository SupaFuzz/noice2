/*
    wcSplitter.js
    6/2/24 Amy Hicox <amy@hicox.com>

    this is a flexible UI splitter something like this:

    ------------------------------------------------------------
    | | ---------------------------------------------------- | |
    | |                                                      | |
    | |                         A                            | |
    | |                                                      | |
    | | ---------------------------------------------------- | |
    | |                                                      | |
    | |                         B                            | |
    | |                                                      | |
    | | ---------------------------------------------------- | |
    ------------------------------------------------------------

    where the middle line is a handle that can be click/dragged
    to resize the split.

        TO-DO 6/2/24 @ 2210

        * orientation
        * live-update handle_width
        * live-update section_margin
        * quad-splitter option

 */

import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcSplitter extends noiceAutonomousCustomElement {




static classID = wcSplitter;
static classAttributeDefaults = {

    orientation: { observed: true, accessor: true, type: 'enum', values: ['vertical', 'horizontal'], value: 'horizontal' },
    handle_width: { observed: true, accessor: true, type: 'str', value: '.25em' },
    section_margin: { observed: true, accessor: true, type: 'str', value: '0' },

    // elementAttributes
    a: { observed: true, accessor: true, type: 'elementAttribute', value: 'A' },
    b: { observed: true, accessor: true, type: 'elementAttribute', value: 'B' },


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
    this._className = 'wcSplitter';
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
        _dragStart: []
    });
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcSplitter.classAttributeDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.innerHTML = `
        <div class="section" data-_name="a"></div>
        <div class="section" data-_name="b"></div>
    `
    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize()
*/
initializedCallback(){
    let that = this;

    // setup clickHandlers on the sections to block click on the background for the handle
    that.DOMElement.querySelectorAll('.section').forEach((el) => {
        el.addEventListener("mousedown", (evt) => { evt.stopPropagation(); });
    });

    // background clickHandler / drag-start
    that.DOMElement.addEventListener("mousedown", (evt) => {
        that._dragStart = [
            evt.clientX,
            evt.clientY,
            that._elements.a.offsetHeight,
            that._elements.b.offsetHeight,
            (that._elements.a.offsetHeight/(that._elements.a.offsetHeight + that._elements.b.offsetHeight)),
            (that._elements.b.offsetHeight/(that._elements.a.offsetHeight + that._elements.b.offsetHeight)),
        ];
        that._dragListener = that.getEventListenerWrapper((evt, slf) => { slf.handleDrag(evt, slf); });
        that.DOMElement.addEventListener('mousemove', that._dragListener);
    });

    that.DOMElement.addEventListener("mouseup", (evt) => {
        if (that._dragListener instanceof Function){
            that.DOMElement.removeEventListener('mousemove', that._dragListener);
        }
    });

}




/*
    handleDrag(evt, slf)
*/
handleDrag(evt, slf){
    let deltaY = (evt.clientY - this._dragStart[1]);
    let deltaYPct = deltaY / (this._dragStart[2] + this._dragStart[3]);
    this.DOMElement.style.gridTemplateRows = `${(this._dragStart[4] + deltaYPct)*100}% ${((this._dragStart[4] + this._dragStart[5]) - (this._dragStart[4] + deltaYPct))*100}%`;
}



/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        height: 100%;
        width: 100%;
    }
    .wcSplitter {
        display: grid;
        height: 100%;
        width: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr;
        background-color: var(--wc-splitter-background-color, transparent);
        user-select: none;
    }
    .section {
        overflow-x: auto;
        user-select: text;
    }
    .section[data-_name="a"]{
        background-color: var(--wc-splitter-a-background-color, transparent);
        margin: ${this.section_margin} ${this.section_margin} ${this.handle_width} ${this.section_margin};
        border-bottom: var(--wc-splitter-handle-border, .128em solid rgba(240, 240, 240, .3));
    }
    .section[data-_name="b"]{
        background-color: var(--wc-splitter-b-background-color, transparent);
        margin: ${this.handle_width} ${this.section_margin} ${this.section_margin} ${this.section_margin};
        border-top: var(--wc-splitter-handle-border, .128em solid rgba(240, 240, 240, .3));
    }
`)};


}
const _classRegistration = wcSplitter.registerElement('wc-splitter');
export { wcSplitter };
