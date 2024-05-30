/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

class layoutTest extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'layoutTest',
            debug: false,
            themeStyle: null
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){

return(`
    <div class="horizontalSplitter" data-templatename="horizontalSplitter" data-templateattribute="true">
        <div class="upper section" data-templatename="upperSection" data-templateattribute="true"></div>
        <div class="lower section" data-templatename="lowerSection" data-templateattribute="true"></div>
    </div>
`)
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;

    // lessee if we can make a clickHandler that ONLY fires on the background
    that.DOMElement.querySelectorAll('.section').forEach((el) => {
        el.addEventListener("mousedown", (evt) => { evt.stopPropagation(); });
        //el.addEventListener("mouseup", (evt) => { evt.stopPropagation(); });
    });

    that._DOMElements.horizontalSplitter.addEventListener("mousedown", (evt) => {
        that._dragStart = [
            evt.clientX,
            evt.clientY,
            that._DOMElements.upperSection.offsetHeight,
            that._DOMElements.lowerSection.offsetHeight,
            (that._DOMElements.upperSection.offsetHeight/(that._DOMElements.upperSection.offsetHeight + that._DOMElements.lowerSection.offsetHeight)),
            (that._DOMElements.lowerSection.offsetHeight/(that._DOMElements.upperSection.offsetHeight + that._DOMElements.lowerSection.offsetHeight)),

        ];
        console.log(`horizontalSplitter grabbed`, that._dragStart);
        that._dragListener = that.getEventListenerWrapper((evt, slf) => { slf.handleDrag(evt, slf); });
        that._DOMElements.horizontalSplitter.addEventListener('mousemove', that._dragListener);
    });

    that._DOMElements.horizontalSplitter.addEventListener("mouseup", (evt) => {
        console.log(`horizontalSplitter released`);
        if (that._dragListener instanceof Function){
            that._DOMElements.horizontalSplitter.removeEventListener('mousemove', that._dragListener);
        }
    });

    /*
        LOH 5/29/24 @ 2301
        it works! really smoothly too!

        next step -- componentize it
        conidder something like splitter
        with orientation="horisontal" | "vertical"

        may need to change pane naming conventions
        something for tomorrow
    */

}
/*
    handleDrag(evt, slf)
*/
handleDrag(evt, slf){
    let deltaY = (evt.clientY - this._dragStart[1]);
    let deltaYPct = deltaY / (this._dragStart[2] + this._dragStart[3]);
    this._DOMElements.horizontalSplitter.style.gridTemplateRows = `${(this._dragStart[4] + deltaYPct)*100}% ${((this._dragStart[4] + this._dragStart[5]) - (this._dragStart[4] + deltaYPct))*100}%`;
}


/*
    gainFocus()
    the UI is gaining focus from a previously unfocused state
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){

        // be outa here wit ya badass ...
        toot(true);
    }));
}




/*
    losefocus(forusArgs)
    fires every time we gain focus
*/
loseFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




}
export { layoutTest };
