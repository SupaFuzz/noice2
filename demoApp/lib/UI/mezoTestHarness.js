/*
    wcTableScratch.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcFormElement } from '../../../lib/webComponents/wcFormElement.js';
import { wcBalloonDialog } from '../../../lib/webComponents/wcBalloonDialog.js';
import { wcPieChart } from '../../../lib/webComponents/wcPieChart.js';
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
                <wc-form-element type="text" data-templatename="proxypath" data-templateattribute="true" label="proxypath" default_value="/REST" capture_value_on="focusoutOrReturn"></wc-form-element>
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
            { name: 'id', order: 1, type: 'int', width: '5em' },
            { name: 'type', order: 2, type: 'char', width: '8em'},
            { name: 'name', order: 3, type: 'char', width: '15em', disableCellEdit: false },
            { name: 'size', order: 4, type: 'int', width: '8em'}
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
        allow_cell_edit: false,
        fit_parent: true,
        rowDblClickCallback: async (rowElement, span, tblRef) => { return(that.handleRowDblClick(rowElement, span, tblRef)); }
    });
    that._DOMElements.tableContainer.appendChild(fileList);


    // make the api object
    that.api = new noiceMezoAPI({
        protocol: window.location.protocol.replace(':',''),
        server: window.location.hostname,
        proxyPath: that._DOMElements.proxypath.value
    });

    // bind proxyPath value change to attribute
    that._DOMElements.proxypath.captureValueCallback = (n,s) => {
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
    handleRowDblClick(rowElement, span, tblRef)
    pop-a-dilly, show download progress, make a file
    download link or if it's an image, show it
*/
handleRowDblClick(rowElement, span, tblRef){
    let that = this;
    return(new Promise((toot, boot) => {
        let dta = JSON.parse(rowElement.dataset.rowdata);

        // hey, what's ...
        let theDillyYo = new wcBalloonDialog({
            arrow_position: 'none',
            lightbox: true,
            title: dta.name,
            exitCallback: async (dilly) => {
                toot(true);
            }
        });

        // the content
        let div = document.createElement('div');
        div.style.display = "grid";
        div.style.gridTemplateColumns = "auto auto";
        div.style.placeContent = "center";
        div.setAttribute('slot', "dialogContent");
        div.innerHTML = `
            <wc-pie-chart size="5.5em"></wc-pie-chart>
            <h2>loading ...</h2>
        `;
        theDillyYo.appendChild(div);
        theDillyYo.relativeElement = that.DOMElement;
        that.DOMElement.appendChild(theDillyYo);

        // get get um!
        this.api.getFile({
            fileName: dta.name,
            progressCallback: (r, t, d) => {
                div.querySelector('wc-pie-chart').value = ((r/t)*100);
            }
        }).then((file) => {
            const blob = new Blob([file.data], { type: file.type });

            // if it's an image, just display it as the css backgroundImage
            if (/^image\//i.test(file.type)){
                let lnk = URL.createObjectURL(blob);
                div.style.background = `url('${lnk}')`;
                div.style.backgroundSize = "contain";
                div.style.backgroundRepeat = "no-repeat";
                div.style.backgroundPosition = "center";
            }else{
                // just make a link that looks like a button to download it
                const fileURL = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = fileURL;
                a.download = file.file_name;
                a.textContent = `download ${file.file_name}`;
                div.appendChild(a);
            }

            // either way remove the progress indicator and message
            let v = div.getBoundingClientRect();
            div.style.width = `${v.width}px`;
            div.style.height = `${v.height}px`;
            div.querySelector('wc-pie-chart ').remove();
            div.querySelector('h2').remove();

        }).catch((error) => {
            console.log(`getFile() | ${error}`);
        })

    }));
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
