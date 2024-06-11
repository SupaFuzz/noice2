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

import { wcBasic } from '../../../lib/webComponents/wcBasic.js';
wcBasic.registerElement('wc-basic');

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
    <div class="spacer" data-templatename="rando2Container" data-templateattribute="true" style="
        width: 20em;
        height: 20em;
        background-color: rgba(240, 240, 240, .2);
        position: relative;
        right: -15em;
    ">
    <div class="rando" data-templatename="rando2" data-templateattribute="true" style="
        width: .5em;
        height: .5em;
        background-color: orange;
        position: relative;
        top: 5em;
        left: 5em;
    "></div>
    </div>
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
            const btnTest = document.createElement('button');
            btnTest.textContent = "close";

            let b = document.createElement('div');
            that.testDialog = new wcBalloonDialog({
                //full_screen: true,
                arrow_position: 'topRight',
                x: '10px',
                y: '10px',
                z: 9,
                title: "hi there",
                dialogContent: b,
                headerContent: btnTest,
                /*
                exitCallback:  (selfRef) => {return(new Promise((toot, boot) => {
                    let limit = 300;
                    function dumbShit(i){
                        if (i > limit){
                            toot(true);
                        }else{
                            selfRef.title = `destruct: ${limit - i}`;
                            requestAnimationFrame(() => { dumbShit(i + 1); });
                        }
                    }
                    dumbShit(0);
                }))}
                */
            });

            // relativeElement
            //that.testDialog.relativeElement = btnBalloon;
            //that.testDialog.relativeElement = that._DOMElements.rando;
            that.testDialog.relativeElement = that._DOMElements.rando2;

            // btns in headers!
            btnTest.addEventListener('click', (evt) => { that.testDialog.exit()})

            // build the poisition menu
            let s = b.attachShadow({mode: 'open'});
            let m = document.createElement('div');
            m.className = "positionMenu";
            m.style.display = "grid";

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
                    let p = (btn.dataset.selected == "true");
                    m.querySelectorAll('button[data-selected="true"]').forEach((el) => {el.dataset.selected = false; });
                    btn.dataset.selected = (! p);
                });
                return(btn);
            }).forEach((el) => { m.appendChild(el); });
            const mnuStyle = document.createElement('style');
            mnuStyle.textContent = `/* full 90's mode */
button {
    background-color: transparent;
    color: rgba(191, 191, 24, .6);
    font-size: .8em;
    font-family: Comfortaa;
    text-align: left;
    padding-left: .5em;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: .128em solid rgba(191, 191, 24, .1);
    transition: background-color .5s ease;
}
button:hover {
    background-color: rgba(191, 191, 24, .1);
    color: rgba(191, 191, 24, .9);
}
button:active {
    background-color: rgba(191, 191, 24, .9);
    color: rgb(5, 15, 20);
}
button[data-selected="true"]{
    color: rgba(191, 191, 24, .9);
}
button[data-selected="true"]:before {
    content: '◉';
    padding-right: .25em;
}
button[data-selected="false"]:before {
    content: '◎';
    padding-right: .25em;
    opacity: .5;
}`;
            s.appendChild(mnuStyle)

            s.appendChild(m);

        }

        // oof! locking something to screen coordinates, this thing has to go at the root :-/
        //that.DOMElement.appendChild(that.testDialog);
        //document.body.appendChild(that.testDialog);
        that._DOMElements.rando2Container.appendChild(that.testDialog);
    });



    // wcBasic
    const btnBasic = document.createElement('button');
    btnBasic.textContent = "wcBasic";
    that._DOMElements.btnContainer.appendChild(btnBasic);
    btnBasic.addEventListener('click', (evt) =>{
        that.thing = new wcBasic({
            content: `<h1 data-_name="lyric">I talk de talk and I walk de walk</h1>`,
            styleSheet: `
                h1 {
                    color: rgb(230, 0, 161);
                    animation: bluh 3s linear infinite;
                }
                @keyframes bluh {
                    0% {
                        color: rgba(230, 0, 161, .1);
                        filter: blur(1.5em);
                    }
                    50% {
                        color: rgba(230, 0, 161, .9);
                        filter: blur(0);
                    }
                    100% {
                        color: rgba(230, 0, 161, .1);
                        filter: blur(1.5em);
                    }
                }
            `,
            initializedCallback: (slf) => {console.log("initializedCallback() is here!")}
        });
        that.DOMElement.appendChild(that.thing);
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
