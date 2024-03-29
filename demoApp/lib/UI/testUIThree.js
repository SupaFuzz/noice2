/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

class testUIThree extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'testUIThree',
            pies: {},
            debug: false,
            _isTyping:              false,
            isTypingCheckInterval:  150,   // 100 == 10 times a second
            isTypingTimeout:        500,   // half a second
            scanIndicatorTimeout:   (1000 * 30), // 30 seconds
            _shiftFlag:             false,
            _scanBuffer:            [],
            _found:                 [],
            scanListener:           null,
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <div class="chartContainer" data-templatename="chartContainer" data-templateattribute="true"></div>
    <div class="scanCage" data-templatename="scanCage" data-templateattribute="true" style="color: rgb(240, 240, 240);display:grid;"></div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;

    // fix layout for chart grid stuffs
    that.DOMElement.style.alignItems = 'baseline';
    that.DOMElement.style.justifyContent = 'flex-start';
    that._DOMElements.chartContainer.style.padding = '1em';

    // placeholder message
    let bs = document.createElement('h1');
    bs.style.width="max-content";
    bs.textContent = `${that._className} v${that._version} | work in progress`
    that.chartContainer = bs;
}




/*
    gainFocus()
    the UI is gaining focus from a previously unfocused state
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){

        // bind the scanHandler to keydown event
        that.scanListener = that.getEventListenerWrapper(function(evt, sr){ that.scanHandler(evt); });
        document.addEventListener('keydown', that.scanListener);

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

        // unbind the scanHandler from the keydown event
        if (that.scanListener instanceof Function){
            document.removeEventListener('keydown', that.scanListener);
            that.scanListener = null;
        }

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}

}
export { testUIThree };
