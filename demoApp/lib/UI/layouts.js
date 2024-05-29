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
    that.DOMElement.querySelectorAll('.section').forEach((el) => { el.addEventListener("click", (evt) => {
        evt.stopPropagation();
        console.log(`${el.dataset.templatename} clicked`);
    })});

    that._DOMElements.horizontalSplitter.addEventListener("click", (evt) => {
        console.log(`horizontalSplitter clicked`);
    });

    /*
        LOH 5/28/24 @ 2250
        next step I think do this:
        
        mousedown -> capture upper and lower outerHeight
                  -> calculate % by DOMElement.height
                  -> set gridTemplateRows
                  -> capture click[x,y]
                  -> spawn mousemove listener

        mousemove -> capture delta-y
                  -> calculate delta-y as % of DOMElement.height
                  -> calculate new gridTemplateRows as
                      -> apply + delta-y as subtract from upper + add remainder to lower
                      -> apply - delta-y as add to upper + subtract remainder from upper

        mouseup  -> terminate mousemove listener
    */

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
