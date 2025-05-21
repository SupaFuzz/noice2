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

    // send the default menu from the uiHolder to the burgerMenu in the balloonDialog
    window.mainUI.burgerMenuContent.innerHTML = '';
    window.mainUI.burgerMenuContent.appendChild(window.uiHolder.getUIMenu());

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

    // add a hook to the test1 UI to do the progressDialog
    window.uiHolder.UIs.test1.querySelector('button').addEventListener('click', (evt) => {
        window.mainUI.progress_menu_open = true;
        window.mainUI.progressUI.title = "doin' it!";
        window.mainUI.progressUI.detail = "and doin' it";
        window.mainUI.progressUI.additional_detail = "and doin' it well";
        function recursor(idx){
            if (idx < 100){
                window.mainUI.progressUI.percent = idx;
                requestAnimationFrame(() => { recursor(idx + 1) })
            }else{
                window.mainUI.progress_menu_open = false;
            }
        }
        recursor(0);
        /*
        temp0.progress_menu_open = true;
        temp0.progressUI.title = "hello";
        temp0.progressUI.detail = "is it me";
        temp0.progressUI.additional_detail = "you're lookin' for?"
        temp0.progressUI.percent = 33;
        */
    });
});
