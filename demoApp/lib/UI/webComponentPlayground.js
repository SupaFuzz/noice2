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

import { wcBalloonDialog } from '../../../lib/webComponents/wcBalloonDialog.js';
wcBalloonDialog.registerElement('wc-balloon-dialog');

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
    that.DOMElement.style.height = "100%";
    //that.DOMElement.style.maxHeight = "100%";

    // wcFormElement test
    const btnFormElement = document.createElement('button');
    btnFormElement.textContent = "test formElement";
    that.DOMElement.appendChild(btnFormElement);
    btnFormElement.addEventListener('click', (evt) => {
        that.testFormElement = new wcFormElement({
            label: 'test field',
            name: 'test',
            type: 'text',
            capture_value_on: 'change',
            show_undo_button: true,
            show_menu_button: true,
            captureValueCallback: (val, slf) => {slf.log(`[value]: ${val}`); },
            menuCallback: (slf, btn) => {
                slf.log('menu callback');
                btnFormElement.disabled = true;
                setTimeout(() => {btnFormElement.disabled = false}, 1500);
            },
            undoCallback: (slf, btn) => {
                slf.log('undo callback');
                btnFormElement.disabled = true;
                setTimeout(() => {btnFormElement.disabled = false}, 1500);
            },
            log: (str) => { console.log(`hi there: ${str}`); }
        });
        /*
        that.testFormElement.addEventListener('capture_value', (evt) => {
            console.log(`[name]: ${evt.detail.self.name} [value]: ${evt.detail.value}`);
        })
        */
        that.DOMElement.appendChild(that.testFormElement);
    });

    // wcBalloonDialog test
    const btnBalloon = document.createElement('button');
    btnBalloon.textContent = 'test wcBalloonDialog';
    that.DOMElement.appendChild(btnBalloon);

    let b = document.createElement('div');
    b.insertAdjacentHTML('afterbegin', "<ul><li>she</li><li>done already</li><li>done</li><li>had herses</li></ul>");

    btnBalloon.addEventListener('click', (evt) => {
        that.testDialog = new wcBalloonDialog({
            arrow_position: 'top',
            x: '10px',
            y: '10px',
            z: 9,
            title: "hi there",
            dialogContent: b
        });
        that.DOMElement.appendChild(that.testDialog);
    });



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
