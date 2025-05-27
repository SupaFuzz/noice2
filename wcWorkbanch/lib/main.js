import { wcPieChart } from '../../lib/webComponents/wcPieChart.js';
import { wcMainUI } from '../../lib/webComponents/wcMainUI.js';
import { wcProgressUI } from '../../lib/webComponents/wcProgressUI.js';
import { wcScreenHolder } from '../../lib/webComponents/wcScreenHolder.js';
import { wcBasic } from '../../lib/webComponents/wcBasic.js';
import { wcScreen } from '../../lib/webComponents/wcScreen.js';

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
                    "Continue": true
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
    window.uiHolder.UIs.test1.querySelector('button[data-_name="progTest"]').addEventListener('click', (evt) => {
        window.mainUI.progress_menu_open = true;
        window.mainUI.progressUI.title = "doin' it!";
        window.mainUI.progressUI.detail = "and doin' it";
        window.mainUI.progressUI.additional_detail = "and doin' it well";
        function recursor(idx){
            if (idx < 100){
                window.mainUI.progressUI.percent = idx;
                requestAnimationFrame(() => { recursor(idx + .15) })
            }else{
                window.mainUI.progress_menu_open = false;
            }
        }
        recursor(0);
    });

    // add a hook to the test1 UI to do the progressDialog with animation
    window.uiHolder.UIs.test1.querySelector('button[data-_name="progTest2"]').addEventListener('click', (evt) => {
        window.mainUI.progress_menu_open = true;
        window.mainUI.progressUI.title = "doin' it!";
        window.mainUI.progressUI.detail = "and doin' it";
        window.mainUI.progressUI.additional_detail = "and doin' it well";
        window.mainUI.progressUI.run_animation = true;
        function recursor(idx){
            if (idx < 100){
                window.mainUI.progressUI.percent = idx;
                requestAnimationFrame(() => { recursor(idx + .15) })
            }else{
                window.mainUI.progress_menu_open = false;
            }
        }
        recursor(0);
    });

    // create a fancy about menu
    let aboutMenu = new wcBasic({
        content: `
            <div class="aboutMenu">
                <h2>wcWorkbanch v1.0</h2>
                <p>
                    <span class="date">5/22/2025</span>
                    <span class="author">Amy Hicox</span>
                    <span class="email">amy@hicox.com</span>
                </p>
                <fieldset>
                    <legend>test thread activity indicators</legend>
                    <button>net-read</button>
                    <button>net-write</button>
                    <button>db-read</button>
                    <button>db-write</button>
                    <button>pending</button>
                    <button>clear</button>
                </fieldset>
            </div>
        `,
        styleSheet: `
            .aboutMenu {
                font-family: Comfortaa;
                padding: 1em;
            }
            .aboutMenu h2, .aboutMenu p {
                text-align: center;
            }
            .aboutMenu legend {
                margin-top: 3em;
            }
        `,
        initializedCallback: (slf) => {
            slf.shadowRoot.querySelectorAll('button').forEach((el) => {
                el.addEventListener('click', (evt) => { window.mainUI._elements.btnIndicator.dataset.status = el.textContent; });
            });
        }
    });
    aboutMenu.setAttribute('slot', 'status_menu_content');
    window.mainUI.appendChild(aboutMenu);
});
