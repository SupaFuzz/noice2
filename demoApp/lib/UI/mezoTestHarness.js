/*
    wcTableScratch.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcFormElement } from '../../../lib/webComponents/wcFormElement.js';
import { noiceMezoAPI } from '../../../lib/noiceMezoAPI.js';

class mezoTestHarness extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'mezoTestHarness',
            debug: false,
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <div class="frame" data-templatename="frame" data-templateattribute="true">
        <h1>Mezo</h1>

        <p>
            For these tests, you need a <a href="https://github.com/SupaFuzz/mezo">mezo server</a> running
            in a reverse proxy available on the <strong>proxyPath</strong> specified below.
        </p>

        <wc-form-element type="text" data-templatename="proxypath" data-templateattribute="true" label="proxypath" default_value="/REST"></wc-form-element>
        <wc-form-element type="text" data-templatename="username" data-templateattribute="true" label="user"></wc-form-element>
        <wc-form-element type="password" data-templatename="pass" data-templateattribute="true" label="password"></wc-form-element>
        <button id="btnAuth" data-templatename="btnAuth" data-templateattribute="true" style="width:max-content; margin-top:.5em;">Log In</button>

        <div class="testStuff" data-templatename="testStuff" data-templateattribute="true"></div>
    </div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;
    that.DOMElement.style.display = "grid";
    that.DOMElement.style.height = "100%";
    that.DOMElement.style.alignContent = "baseline";
    that.DOMElement.style.justifyContent = "center";
    that.DOMElement.style.gridTemplateRows = 'auto auto auto';

    that._DOMElements.frame.style.display = "grid";
    that._DOMElements.frame.style.width = "66%";

    // make the api object
    that.api = new noiceMezoAPI({
        protocol: window.location.protocol.replace(':',''),
        server: window.location.hostname,
        proxyPath: that._DOMElements.proxypath.value
    });

    // bind proxyPath value change to attribute
    that._DOMElements.proxypath.valueChangeCallback = (n,o,s) => {
        console.log(`set new proxyPath: ${n}`);
        that.api.proxyPath = n;
    };

    // bind the login button
    that._DOMElements.btnAuth.addEventListener('click', (evt) => {
        that.api.authenticate({
            user: that._DOMElements.username.value,
            password: that._DOMElements.pass.value
        }).then((api) => {
            console.log(api.token);
        }).catch((error) => {
            // yeah i dunno
            console.log(error);
        })

        /*
            LOH 1/13/25 @ 2117 -- diner I guess, sigh ...
            so anyhow yeah the above works.

            I guess fancicify it. Make some kinda terminal
            like display or something to show the token?

            we need a file input to test file upload
            some kinda list em or something.
            show what's happening and we need to
            do the old one-time-token-convert-to-change-paddy thing
            
        */
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
export { mezoTestHarness };
