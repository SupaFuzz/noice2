/*
    workbenchUI.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcBasic } from '../../../lib/webComponents/wcBasic.js';
import { wcToggle } from '../../../lib/webComponents/wcToggle.js';

class workbenchUI extends noiceCoreUIScreen {


/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'workbenchUI',
            debug: false,
            themeStyle: null,
            runAnimation: false
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){
    return(`
        <div data-templatename="test" data-templateattribute="true"></div>
        <wc-toggle label="test toggler" data-templatename="toggleTest" data-templateattribute="true"></wc-toggle>
    `);
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){

    // a bit cheeky I must say
    let that = this;

    that._DOMElements.toggleTest.captureValueCallback = (value, self) => {
        console.log(`toggler value: ${value}`);
    }
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
export { workbenchUI };
