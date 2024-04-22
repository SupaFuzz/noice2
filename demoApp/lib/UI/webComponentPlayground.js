/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcPieChart } from '../../../lib/webComponents/wcPieChart.js';
wcPieChart.registerElement('wc-pie-chart');

import { wcFormElement } from '../../../lib/webComponents/wcFormElement.js';
wcFormElement.registerElement('wc-form-element');

class webComponentPlayground extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'webComponentPlayground',
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
    <h1>Web Component Playground</h1>
`)
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;
    that.DOMElement.style.display = "grid";
    that.DOMElement.style.height = "max-content";
    that.DOMElement.style.maxHeight = "100%";

    const btn = document.createElement('button');
    btn.textContent = "test";
    that.DOMElement.appendChild(btn);
    btn.addEventListener('click', (evt) => {
        that.testFormElement = new wcFormElement({
            type: 'color',
            capture_value_on: 'change',
            captureValueCallback: (val, slf) => {slf.log(`[value]: ${val}`); },
            log: (str) => { console.log(`hi there: ${str}`); }
        });
        that.DOMElement.appendChild(that.testFormElement);
    })

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
export { webComponentPlayground };
