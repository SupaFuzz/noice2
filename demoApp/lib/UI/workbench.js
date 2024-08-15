/*
    workbenchUI.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcBasic } from '../../../lib/webComponents/wcBasic.js';

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

    `);
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){

    // a bit cheeky I must say
    let that = this;

    that.switch = new wcBasic({
        content: `<div data-_name="gutter"><span data-_name="knob" data-on="true"></span></div>`,
        initializedCallback: (slf) => {
            slf._elements.knob.addEventListener('click', (evt) => {
                evt.stopPropagation();
                slf._elements.gutter.dataset.on = (!(slf._elements.gutter.dataset.on == "true"));
            });
            slf._elements.gutter.addEventListener('click', (evt) => {
                slf._elements.gutter.dataset.on = '';
            });
        },
        styleSheet: `
            :host {
                display: block;
                position: relative;
            }
            div[data-_name="gutter"][data-on="true"] span[data-_name="knob"]{
                justify-self: right;
            }
            div[data-_name="gutter"][data-on="false"] span[data-_name="knob"]{
                justify-self: left;
            }
            div[data-_name="gutter"][data-on="true"]{
                background-color: rgba(0, 255, 0, .35);
            }
            div[data-_name="gutter"][data-on="false"]{
                background-color: rgba(255, 0, 0, .35);
            }
            div[data-_name="gutter"]{
                height: 2em;
                width:  5em;
                background: radial-gradient(ellipse at top left, rgba(240, 240, 240, .25), rgba(240, 240, 240, .1), rgba(0, 0, 0, .13));
                transition: all .128s ease-in-out;
                border-radius: 1.5em;
                border: .128em solid rgba(240, 240, 240, .5);
                box-shadow: 2px 2px 2px rgba(20, 22, 23, .3) inset;
                display: grid;
                align-items: center;
            }
            span[data-_name="knob"]{
                height: 1.5em;
                width: 1.5em;
                border-radius: 50%;
                background: radial-gradient(ellipse at top left, rgba(240, 240, 240, .25), rgba(240, 240, 240, .1), rgba(0, 0, 0, .13));
                background-color: rgba(240, 240, 240, .75);
                box-shadow: 2px 2px 2px rgba(20, 22, 23, .1);
                margin-right: .25em;
                margin-left: .25em;
                justify-self: center;
            }
        `
    });

    that._DOMElements.test.appendChild(that.switch);

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
