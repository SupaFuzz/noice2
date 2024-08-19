/*
    workbenchUI.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcBasic } from '../../../lib/webComponents/wcBasic.js';
import { wcLeftPanelLayout } from '../../../lib/webComponents/wcLeftPanelLayout.js';

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
        <wc-left-panel-layout title="test panel"></wc-left-panel-layout>
    `);
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){

    // a bit cheeky I must say
    let that = this;

    let wc = that.DOMElement.querySelector('wc-left-panel-layout');

    /* brute force add button
    wc.initCallback = (slf) => {

        let btn = document.createElement('button');
        btn.className="icon";
        btn.style.background = `url('./gfx/buttons/burger.svg')`;
        btn.style.backgroundRepeat = "no-repeat";
        btn.style.backgroundSize = "contain";
        slf._elements.buttonContainer.appendChild(btn);

        let addBtn = document.createElement('button');
        addBtn.className="icon";
        addBtn.style.background = `url('./gfx/buttons/add_icon_dark.svg')`;
        addBtn.style.backgroundRepeat = "no-repeat";
        addBtn.style.backgroundSize = "contain";
        slf._elements.buttonContainer.appendChild(addBtn);
    }
    */

    // elegant add buttons
    let btn = document.createElement('button');
    btn.className="icon";
    btn.style.background = `url('./gfx/buttons/burger.svg')`;
    btn.style.backgroundRepeat = "no-repeat";
    btn.style.backgroundSize = "contain";
    wc.addButton({
        name: 'burger',
        element: btn,
        icon: true,
        order: 1,
        callback: (btn, slf, evt) => {
            console.log(`${btn.dataset.name} button clicked!`);
        }
    });

    let addBtn = document.createElement('button');
    addBtn.className="icon";
    addBtn.style.background = `url('./gfx/buttons/add_icon_dark.svg')`;
    addBtn.style.backgroundRepeat = "no-repeat";
    addBtn.style.backgroundSize = "contain";
    wc.addButton({
        name: 'add',
        element: addBtn,
        icon: true,
        order: 2,
        callback: (btn, slf, evt) => {
            console.log(`${btn.dataset.name} button clicked!`);
        }
    });


    // panelToggleCallback
    wc.panelToggleCallback = (open, slf) => {
        console.log(`panel is open: ${open}`);
    }

    // tmp for messing about
    window.wcTest = wc;

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
