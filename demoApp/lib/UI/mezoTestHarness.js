/*
    wcTableScratch.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcFormElement } from '../../../lib/webComponents/wcFormElement.js';
import { wcBalloonDialog } from '../../../lib/webComponents/wcBalloonDialog.js';
import { wcTable } from '../../../lib/webComponents/wcTable.js';
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
        <h1 style="margin: .25em;">Mezo</h1>

        <p style="width: 66%;">
            For these tests, you need a <a href="https://github.com/SupaFuzz/mezo">mezo server</a> running
            in a reverse proxy available on the <strong>proxyPath</strong> specified below.
        </p>

        <div style="display: grid; grid-template-columns: auto auto;">
            <div class="formElements">
                <wc-form-element type="text" data-templatename="proxypath" data-templateattribute="true" label="proxypath" default_value="/REST"></wc-form-element>
                <wc-form-element type="text" data-templatename="username" data-templateattribute="true" label="user"></wc-form-element>
                <wc-form-element type="password" data-templatename="pass" data-templateattribute="true" label="password"></wc-form-element>
                <button id="btnAuth" data-templatename="btnAuth" data-templateattribute="true" style="width:max-content; margin-top:.5em;">Log In</button>
            </div>
            <div data-templatename="tableContainer" data-templateattribute="true" style="font-size:.8em; ">
            </div>
        </div>

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
    that._DOMElements.frame.style.width = "100%";

    // make the table
    let fileList = new wcTable({
        label: 'mezo.files',
        columns: [
            { name: 'id', order: 1, type: 'int', width: '5em', disableCellEdit: true },
            { name: 'type', order: 2, type: 'char', width: '8em', disableCellEdit: true },
            { name: 'name', order: 3, type: 'char', width: '15em' },
            { name: 'size', order: 4, type: 'int', width: '8em', disableCellEdit: true }
        ],
        rows: [],
        select_mode: 'single',
        show_footer_message: true,
        allow_column_sort: true,
        show_btn_prefs: true,
        show_btn_select_all: true,
        show_btn_select_none: true,
        show_btn_export: true,
        show_btn_search: true,
        allow_cell_edit: true,
        fit_parent: true,
    });
    that._DOMElements.tableContainer.appendChild(fileList);


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
        if (that._DOMElements.btnAuth.textContent == "Log Out"){
            console.log("log-out: to-do (1/10/25)");
        }else{
            that.api.authenticate({
                user: that._DOMElements.username.value,
                password: that._DOMElements.pass.value
            }).then((api) => {
                that.api = api;
                console.log(api.token);
                that._DOMElements.btnAuth.textContent = "Log Out";

                // populate table with file list
                api.getRows({
                    table: 'mezo.files',
                    field_list: ['id','type','name','size']
                }).then((r) => {
                    // r is an array
                    fileList.rows = r;
                }).catch((error) => {
                    // whatevs
                    console.log(error);
                });

            }).catch((error) => {
                // yeah i dunno -- pop an error or something I guess?
                console.log(error);
            })
        }

        /*
            LOH 1/14/25 @ 0015 -- k i'm done
            it works through listing the files
            and initially rendering the table content
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
