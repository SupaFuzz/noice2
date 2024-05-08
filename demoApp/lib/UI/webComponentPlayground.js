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
    <div class="btnContainer" data-templatename="btnContainer" data-templateattribute="true"></div>
    <div class="testStuff" data-templatename="testStuff" data-templateattribute="true"></div>
    <div class="rando" data-templatename="rando" data-templateattribute="true" style="
        width: .5em;
        height: .5em;
        background-color: green;
        position: relative;
        top: 5em;
        left: 5em;
    "></div>
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
    that.DOMElement.style.alignContent = "baseline";
    that.DOMElement.style.gridTemplateRows = 'auto auto auto';

    // wcFormElement test
    const btnFormElement = document.createElement('button');
    btnFormElement.textContent = "test formElement";
    that._DOMElements.btnContainer.appendChild(btnFormElement);
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
        that._DOMElements.testStuff.appendChild(that.testFormElement);
    });

    // wcBalloonDialog test
    const btnBalloon = document.createElement('button');
    btnBalloon.textContent = 'test wcBalloonDialog';
    btnBalloon.className = 'btnBalloon';
    that._DOMElements.btnContainer.appendChild(btnBalloon);


    btnBalloon.addEventListener('click', (evt) => {
        if (!(that.testDialog instanceof wcBalloonDialog)){
            let b = document.createElement('div');
            that.testDialog = new wcBalloonDialog({
                arrow_position: 'topRight',
                x: '10px',
                y: '10px',
                z: 9,
                title: "hi there",
                dialogContent: b
            });
            //that.testDialog.relativeElement = btnBalloon;
            that.testDialog.relativeElement = that._DOMElements.rando;

            b.style.display = "grid";
            ['none',
            'topRight', 'topMiddle', 'topLeft',
            'bottomRight', 'bottomMiddle', 'bottomLeft',
            'rightTop', 'rightMiddle', 'rightBottom',
            'leftTop', 'leftMiddle', 'leftBottom'].map((position) => {
                let btn = document.createElement('button');
                btn.className = "burgerMenu";
                btn.textContent = position;
                btn.dataset.selected = (that.testDialog.arrow_position == position);
                btn.addEventListener("click", (evt) => {
                    that.testDialog.arrow_position = position;
                });
                return(btn);
            }).forEach((el) => { b.appendChild(el); });
        }

        // oof! locking something to screen coordinates, this thing has to go at the root :-/
        //that.DOMElement.appendChild(that.testDialog);
        document.body.appendChild(that.testDialog);
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
