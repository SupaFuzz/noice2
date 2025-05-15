import { wcPieChart } from '../../lib/webComponents/wcPieChart.js';
import { wcMainUI } from '../../lib/webComponents/wcMainUI.js';
import { wcProgressUI } from '../../lib/webComponents/wcProgressUI.js';
import { wcScreenHolder } from '../../lib/webComponents/wcScreenHolder.js';
import { wcBasic } from '../../lib/webComponents/wcBasic.js';

/*
    document.loaded() hook
*/
document.addEventListener("DOMContentLoaded", (evt) => {
    // could do some stuff here if ya wanted

    // ui holder test stuffs
    window.uiHolder = document.body.querySelector('wc-screen-holder');
    window.mainUI = document.body.querySelector('wc-main-ui');

    /*
    // make a menu of the uis on the burger menu (old school)
    window.mainUI.burgerMenuContent.innerHTML = '';
    Object.keys(window.uiHolder.UIs).map((a) => {return(window.uiHolder.UIs[a])}).sort((a,b) => {return(
        parseFloat(a.dataset.menu_order) - parseFloat(b.dataset.menu_order)
    )}).map((ui) => {
        let btn = document.createElement('button');
        btn.textContent = ui.dataset.menu_label;
        btn.addEventListener('click', (evt) => { window.uiHolder.switchUI(ui.dataset.name).then(() => {
            // do something like set selected bool or something
        })});
        return(btn);
    }).forEach((el) => {
        window.mainUI.burgerMenuContent.appendChild(el);
    })
    */
    window.burgerMenu = new wcBasic({
        content: Object.keys(window.uiHolder.UIs).map((a) => {return(window.uiHolder.UIs[a])}).sort((a,b) => {return(
                    parseFloat(a.dataset.menu_order) - parseFloat(b.dataset.menu_order)
                 )}).map((el) => {return(`<button data-name="${el.dataset.name}">${el.dataset.menu_label}</button>`)}).join(""),
        styleSheet: `
            :host {
                display: grid;
                overflow: auto;
            }
            button {
                color: var(--wc-main-ui-header-color);
                background-color: transparent;
                border-color: transparent;
                width: 100%;
                text-align: right;
                font-size: 1.5rem;
                font-family: Comfortaa;

            }
        `,
        initializedCallback: (slf) => {
            slf.shadowDOM.querySelectorAll('button').forEach((el) => {
                el.addEventListener("click", (evt) => {
                    window.uiHolder.switchUI(el.dataset.name);
                });
            })
        }
    });
    window.mainUI.burgerMenuContent.innerHTML = '';
    window.mainUI.burgerMenuContent.appendChild(window.burgerMenu);


    //window.mainUI.burgerMenuContent.textContent = "it worked?";

    // put an are you sure? on the test2 screen
    window.uiHolder.UIs.test2.setFocus = (focusBool, focusArgs) => { return(new Promise((toot, boot) => {
        if (focusBool == false){
            window.mainUI.userQuery({
                title: 'Are you sure?',
                prompt: 'Check out this sweet dialog!',
                detail: "for reasons of demonstration, test2 throws a dialog on exit asking you if you're sure. so are you?",
                options: {
                    "Cancel": false,
                    "continue": true
                }
            }).then((ztdr) => {
                if (ztdr == true){
                    toot(window.uiHolder.UIs.test2);
                }else{
                    boot('user cancelled');
                }
            })
        }else{
            toot(window.uiHolder.UIs.test2);
        }
    }))}


});
