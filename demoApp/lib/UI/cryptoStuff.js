/*
    wcTableScratch.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcFormElement } from '../../../lib/webComponents/wcFormElement.js';
import { noiceCrypto } from '../../../lib/noiceCrypto.js';

class cryptoStuff extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'cryptoStuff',
            debug: false,
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <h1>Crypto Test</h1>

    <wc-form-element type="text" data-templatename="payload" data-templateattribute="true" label="payload"></wc-form-element>
    <wc-form-element type="password" data-templatename="pass" data-templateattribute="true" label="passphrase"></wc-form-element>
    <button id="btnEncrypt" data-templatename="btnEncrypt" data-templateattribute="true">encrypt</button>
    <button id="btnDecrypt" data-templatename="btnDecrypt" data-templateattribute="true">decrypt</button>

    <div class="testStuff" data-templatename="testStuff" data-templateattribute="true" style="
        height: 40vh;
        overflow: hidden;
    "></div>
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
    that.DOMElement.style.gridTemplateRows = 'auto auto auto';

    that.cryptool = new noiceCrypto();
    that.cryptool.salt = 'nc1f4f7d-c72c-40fb-bc79-671181d55dd7';

    that._DOMElements.btnEncrypt.addEventListener('click', (evt) => {
        // how hard could it be? LOL
        that.cryptool.encryptString(
            that._DOMElements.payload.value,
            that._DOMElements.pass.value
        ).then((cipher) => {
            let el = document.createElement('pre');
            el.textContent = cipher;
            that._DOMElements.testStuff.appendChild(el);
        }).catch((e) => {
            console.log(e);
        })
    });

    that._DOMElements.btnDecrypt.addEventListener('click', (evt) => {
        // how hard could it be? LOL
        that.cryptool.decryptString(
            that._DOMElements.payload.value,
            that._DOMElements.pass.value
        ).then((pt) => {
            let el = document.createElement('pre');
            el.textContent = pt;
            that._DOMElements.testStuff.appendChild(el);
        }).catch((e) => {console.log(e);});
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
export { cryptoStuff };
