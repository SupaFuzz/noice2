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
import { noiceMezoRemulatorAPI } from '../../../lib/noiceMezoRemulatorAPI.js';

import { noiceRemedyAPI } from '../../../lib/noiceRemedyAPI.js';

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
    //this.noiceRemedyAPI = noiceRemedyAPI;
}




/*
    html
*/
get html(){return(`
    <div class="frame" data-templatename="frame" data-templateattribute="true">
        <h1 style="margin: .25em;">Mezo</h1>

        <p style="width: 66%;">
            For these tests, you need a <a href="https://github.com/SupaFuzz/mezo">mezo server</a> running
            behind a reverse proxy mapped to the <strong>proxyPath</strong> specified below.
            TO-DO: just build a mezo/remulator admin PWA for the love of god ...
        </p>

        <div style="
            display: grid;
            grid-template-columns: auto auto;
            justify-content: left;
            align-content: center;
            margin: .25em;
        ">
            <div class="formElements" style="
                font-size: .8em;
                background-color: rgba(240, 240, 240, .1);
                padding: .5em;
                border-radius: 1em;
                width: max-content;
                margin: 1em;
            ">
                <h2>remulator login</h2>
                <wc-form-element type="text" data-templatename="proxypath" data-templateattribute="true" label="proxyPath" default_value="/REST" capture_value_on="focusoutOrReturn"></wc-form-element>
                <wc-form-element type="text" data-templatename="username" data-templateattribute="true" label="user"></wc-form-element>
                <wc-form-element type="password" data-templatename="pass" data-templateattribute="true" label="password"></wc-form-element>
                <button id="btnAuth" data-templatename="btnAuth" data-templateattribute="true" style="width:max-content; margin-top:.5em;">Log In</button>
            </div>
            <div data-templatename="tableContainer" data-templateattribute="true" style="font-size:.8em; "></div>

            <div class="formElements" style="
                font-size: .8em;
                background-color: rgba(240, 240, 240, .1);
                padding: .5em;
                border-radius: 1em;
                width: max-content;
                margin: 1em;
            ">
                <wc-form-element type="file" data-templatename="file_input" data-templateattribute="true" label="file" capture_value_on="change"></wc-form-element>
                <button id="btnUpload" data-templatename="btnUpload" data-templateattribute="true" style="width:max-content; margin-top:.5em;">Upload</button>
            </div>

            &nbsp;

            <div class="formElements" style="
                font-size: .8em;
                background-color: rgba(240, 240, 240, .1);
                padding: .5em;
                border-radius: 1em;
                width: max-content;
                margin: 1em;
            ">
                <h2>ars login</h2>
                <wc-form-element type="text" data-templatename="r_proxypath" data-templateattribute="true" label="proxyPath" default_value="/REST" capture_value_on="focusoutOrReturn"></wc-form-element>
                <wc-form-element type="text" data-templatename="r_username" data-templateattribute="true" label="user"></wc-form-element>
                <wc-form-element type="password" data-templatename="r_pass" data-templateattribute="true" label="password"></wc-form-element>
                <button id="r_btnAuth" data-templatename="r_btnAuth" data-templateattribute="true" style="width:max-content; margin-top:.5em;">Log In</button>
            </div>

        </div>

        <div class="testStuff" data-templatename="testStuff" data-templateattribute="true"></div>
    </div>
`)}


/*
    LOH 2/12/25 @ 1324 -- cancer center appointment
    I need a way to pipe the data from the ars server into the remulator tables
    to have a base corpus of data to work from.

    given there's not a convinient way to use noice in node yet, this seems like
    a natual place. I'm thinking just login to both and pipe through. Maybe with a
    progress bar or someting.

*/



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
        label: 'remulator.form_registry',
        columns: [
            { name: 'status', order: 2, type: 'char', width: '5em'},
            { name: 'form_name', order: 3, type: 'char', width: '18em'},
            { name: 'table_name', order: 4, type: 'char', width: '10em', disableCellEdit: false },
            { name: 'count', order: 5, type: 'int', width: '5em' }
        ],
        rows: [],
        select_mode: 'single',
        show_footer_message: true,
        allow_column_sort: true,
        show_btn_prefs: false,
        show_btn_select_all: false,
        show_btn_select_none: false,
        show_btn_export: true,
        show_btn_search: true,
        allow_cell_edit: false,
        fit_parent: true,
        default_sort: { colName: 'form_name', order: 'ascending' },
        custom_buttons: [
            { name: 'load form', callback: (tbl, btn) => { that.handleLoadForm(tbl, btn); } },
            { name: 'install form', callback: (tbl, btn) => { that.handleInstallForm(tbl, btn); }},
            { name: 'refresh', callback: (tbl, btn) => { that.refreshFormTable(that.remulator, tbl); }}
        ]
        /*
        rowDblClickCallback: async (rowElement, span, tblRef) => { return(that.handleRowDblClick(rowElement, span, tblRef)); },
        custom_buttons: [
            { name: 'upload', callback: (tbl, btn) => { that.handleUpload(tbl, btn); } },
            { name: 'refresh', callback: (tbl, btn) => { that.refreshFileTable(that.api, tbl); } }
        ]
        */
    });
    that._DOMElements.tableContainer.appendChild(fileList);
    that.table = fileList;

    // make the other api object
    that.remulator = new noiceMezoRemulatorAPI({
        protocol: window.location.protocol.replace(':',''),
        server: window.location.hostname,
        proxyPath: that._DOMElements.proxypath.value
    });

    // bind proxyPath value change to attribute
    that._DOMElements.proxypath.captureValueCallback = (n,s) => {
        console.log(`set new proxyPath: ${n}`);
        that.remulator.proxyPath = n;
    };

    // bind the login button
    that._DOMElements.btnAuth.addEventListener('click', (evt) => {
        if (that._DOMElements.btnAuth.textContent == "Log Out"){
            that.remulator.logout().catch((e) => {
                console.log(`api logout failed? ${e}`);
            }).then(() => {
                that._DOMElements.btnAuth.textContent = "Log In";
                fileList.clear();
            })
        }else{
            that.remulator.authenticate({
                user: that._DOMElements.username.value,
                password: that._DOMElements.pass.value
            }).then((api) => {
                that.remulator = api;
                console.log(api.token);
                that._DOMElements.btnAuth.textContent = "Log Out";

                that.refreshFormTable(api, fileList);

            }).catch((error) => {
                // yeah i dunno -- pop an error or something I guess?
                console.log(error);
            })
        }
    });

    // bind the upload button and such
    that._DOMElements.file_input.captureValueCallback = (n,s,e) => {
        that._DOMElements.file_input._file = e.target.files[0] || null;
        console.log(`file_input value capture fired!`, that._DOMElements.file_input._file);
    }
    that._DOMElements.btnUpload.addEventListener('click', (evt) => {
        if (that._DOMElements.file_input._file instanceof File){
            const reader = new FileReader();
            reader.addEventListener('loadend', (loadEvt) => {
                const fileContent = new Uint8Array(reader.result);
                const fileName = that._DOMElements.file_input._file.name;
                const fileLength = that._DOMElements.file_input._file.size;
                console.log(`file content loaded: ${fileContent instanceof Uint8Array} | ${fileContent.length}`);

                // ok, lets just try to make a dummy entry on offlineData and see what we can do here
                that.remulator.createTicket({
                    schema: 'NPAM:NSCAN5:offlineData',
                    fields: {
                        Status: 'active',
                        documentName: 'test file',
                        documentLength: fileLength,
                        dataFile: fileName
                    },
                    attachments: {
                        dataFile: fileContent
                    }
                }).then((r) => {
                    console.log(r);
                }).catch((e) => {
                    console.log(e);
                });
            });
            reader.readAsArrayBuffer(that._DOMElements.file_input._file);
        }
    });

    // remedy api login/logout button
    that._DOMElements.r_btnAuth.addEventListener('click', (evt) => {
        if (
            that.isNotNull(that._DOMElements.r_proxypath.value) &&
            that.isNotNull(that._DOMElements.r_username.value) &&
            that.isNotNull(that._DOMElements.r_pass.value)
        ){
            new noiceRemedyAPI({
                protocol: window.location.protocol.replace(':', ''),
                server: window.location.hostname,
                proxyPath: that._DOMElements.r_proxypath.value,
                user: that._DOMElements.r_username.value,
                password: that._DOMElements.r_pass.value
            }).authenticate().then((api) => {
                that.rAPI = api;
            }).catch((error) => {
                console.log(`remedy login fail: ${error}`);
            })
        }else{
            console.log("need stuff for remedy login that ain't here");
        }
    });

}




/*
    refreshFormTable(tbl)
*/
refreshFormTable(api, tbl){
    let that = this;

    tbl.clear();

    // populate table with file list
    api.getRows({
        table: 'remulator.form_registry',
        field_list: ['id','status','form_name','table_name'],
        query: `status=eq.ready`
    }).then((r) => {

        function recursor(idx){
            if (idx == r.length){
                tbl.rows = r;
            }else{
                if (r[idx].status == "ready"){
                    api.getRows({
                        table: `remulator.${r[idx].table_name}`,
                        field_list: ['count()']
                    }).then((re) => {
                        r[idx].count = re[0].count;
                        Promise.resolve().then(() => { recursor(idx + 1); });
                    }).catch((e) =>{
                        console.log(e);
                    })
                }
            }
        }
        recursor(0);

    }).catch((error) => {
        // whatevs
        console.log(error);
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
    handleUpload(tbl, btn)
    pop a dilly with a file selector and a button
    maybe filename. gotta play with that.
*/
handleUpload(tbl, btn){
    let that = this;
    return(new Promise((toot, boot) => {

        // yo, what's ...
        let upDilly = new wcBalloonDialog({
            arrow_position: 'none',
            lightbox: true,
            modal: true,
            title: 'upload file',
            exitCallback: async (dilly) => {
                toot(true);
            }
        });

        // make a lil upload UI
        let div = document.createElement('div');
        div.setAttribute('slot', "dialogContent");
        div.innerHTML = `
            <wc-form-element type="file" label_position="none" capture_value_on="input" style="font-size: .66em;"></wc-form-element>
            <div style="
                display: grid;
                grid-template-columns: auto auto;
            ">
                <wc-pie-chart size="5.5em"></wc-pie-chart>
                <div style="display: flex; flex-direction: row-reverse;">
                    <button class="btnCancel" style="height: fit-content; margin: .25em;">cancel</button>
                    <button disabled class="btnUpload" style="height: fit-content; margin: .25em;">upload</button>
                </div>
            </div>
        `;
        div.style.padding = '.25em';
        div.querySelector('button.btnCancel').addEventListener('click', (evt) => { upDilly.exit(); });
        div.querySelector('button.btnUpload').addEventListener('click', (evt) => {

            // parse out the fileName
            let f = div.querySelector('wc-form-element').value;
            if (/\//.test(f)){
                let g = f.split(/\//);
                f = g[(g.length -1)];
            }else if (/\\/.test(f)){
                let g = f.split(/\\/);
                f = g[(g.length -1)];
            }
            f = f.replace(/[^\x00-\x7F]/g, "");

            // send it
            that.api.putFile({
                fileName: f,
                data: new Uint8Array(that.fileBuffer),
                progressCallback: (r,t,c) => {
                    div.querySelector('wc-pie-chart').value = ((r/t)*100);
                }
            }).then((r) => {
                console.log(`created file`, r);
                // refresh table
                that.refreshFileTable(that.api, that.table);

                upDilly.exit();
            }).catch((error) => {
                console.log(error);
            })

        });
        div.querySelector('wc-form-element').captureValueCallback = (n,s,ev) => {
            const file = ev.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                that.fileBuffer = e.target.result;
                div.querySelector('button.btnUpload').disabled = false;
            };
            reader.readAsArrayBuffer(file);
        };

        upDilly.appendChild(div);
        upDilly.relativeElement = that.DOMElement;

        that.DOMElement.appendChild(upDilly);
    }));
}




/*
    handleLoadForm(tbl, btn)
    load the selected remulator form from the server of record
*/
handleLoadForm(tbl, btn){
    let that = this;
    return(new Promise((toot, boot) => {
        if ((that.rAPI instanceof Object) && (that.rAPI.isAuthenticated)){
            if ((that.remulator instanceof Object) && (that.remulator.isAuthenticated)){
                let selected = that.table.getSelected();
                if (
                    (selected.length > 0) &&
                    (selected[0] instanceof Object) &&
                    (selected[0].data instanceof Object) &&
                    selected[0].data.hasOwnProperty('form_name') &&
                    that.isNotNull(selected[0].data.form_name)
                ){
                    // get the form definition off remulator
                    that.remulator.getFormFields({schema: selected[0].data.form_name}).then((formDef) => {

                        // get record count from remedy api
                        that.rAPI.query({
                            schema: selected[0].data.form_name,
                            fields: [1],
                            QBE: formDef.store_definition._sync.query.QBE
                        }).then((countRows) => {
                            if ((countRows instanceof Object) && (countRows.entries instanceof Array)){


                                // pop a dilly
                                let theDillyYo = new wcBalloonDialog({
                                    arrow_position: 'none',
                                    lightbox: true,
                                    modal: true,
                                    title: selected[0].data.form_name,
                                    exitCallback: async (dilly) => {
                                        that.refreshFormTable(that.remulator, that.table);
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


                                let queue = countRows.entries.filter((row) => {return(
                                    (row instanceof Object) &&
                                    (row.values instanceof Object) &&
                                    row.values.hasOwnProperty(formDef.idIndex[1].name)
                                )}).map((row) => {return(
                                    row.values[formDef.idIndex[1].name]
                                )});

                                // get field list like generateTable would do I guess
                                let field_list = [1, 6]; // entryId & modifiedDate

                                // merge fieldIDs defined as indexes on the storeDef
                                if (formDef.store_definition.indexes instanceof Object){
                                    field_list = field_list.concat(
                                        Object.keys(formDef.store_definition.indexes).filter((indexName) => {return(
                                            (formDef.store_definition.indexes[indexName] instanceof Object) &&
                                            formDef.store_definition.indexes[indexName].hasOwnProperty('_id') &&
                                            (! isNaN(parseInt(formDef.store_definition.indexes[indexName]._id)))
                                        )}).map((indexName) => {return(
                                            parseInt(formDef.store_definition.indexes[indexName]._id)
                                        )})
                                    );
                                }

                                // merge fields on ._sync.query.fields
                                if (
                                     (formDef.store_definition._sync instanceof Object) &&
                                     (formDef.store_definition._sync.query instanceof Object) &&
                                     (formDef.store_definition._sync.query.fields instanceof Array)
                                ){
                                    field_list = field_list.concat(
                                        formDef.store_definition._sync.query.fields.filter((fieldName) => {return(
                                            (formDef instanceof Object) &&
                                            (formDef.nameIndex instanceof Object) &&
                                            (formDef.nameIndex[fieldName] instanceof Object) &&
                                            formDef.nameIndex[fieldName].hasOwnProperty('id')
                                        )}).map((fieldName) => {return(
                                            formDef.nameIndex[fieldName].id
                                        )})
                                    );
                                }
                                field_list = Array.from(new Set(field_list));

                                new Promise((_t, _b) => {
                                    function recursor(idx){
                                        if (idx == queue.length){
                                            _t(true)
                                        }else{

                                            //console.log(`${Math.floor(((idx + 1)/queue.length)*100)}% | ${queue[idx]}`);
                                            div.querySelector('wc-pie-chart').value = Math.floor(((idx + 1)/queue.length)*100);
                                            div.querySelector('h2').textContent = queue[idx];

                                            that.rAPI.getTicket({
                                                schema: selected[0].data.form_name,
                                                fields: field_list,
                                                ticket: queue[idx],
                                                fetchAttachments: true
                                            }).then((r) => {

                                                if ((r instanceof Object) && (r.values instanceof Object)){
                                                    let fields = {};

                                                    /*
                                                        handling attachments, with fetchAttachments true
                                                        this should be the output format
                                                        where 'dataFile' is the name of the attachment field

                                                        r.values.dataFile: {
                                                            name: <str>,
                                                            sizeBytes: <int>,
                                                            data: <blob>
                                                        }

                                                        for output, just filter the attachment field from the put list
                                                        call remulator.putFile(), get the id, then update the row with the
                                                        attachment id
                                                    */


                                                    // convert and preprocess col values
                                                    Object.keys((r.values)).filter((fieldName) => {return(
                                                        (formDef.nameIndex[fieldName] instanceof Object) &&
                                                        (! (formDef.nameIndex[fieldName].datatype == "ATTACHMENT"))
                                                    )}).forEach((fieldName) => {
                                                        if (formDef.nameIndex[fieldName].datatype == 'TIME'){
                                                            r.values[fieldName] = that.toEpoch(r.values[fieldName]);
                                                        }else if (
                                                            (formDef.nameIndex[fieldName].datatype == 'CURRENCY') &&
                                                            (r.values[fieldName] instanceof Object) &&
                                                            r.values[fieldName].hasOwnProperty('decimal')
                                                        ){
                                                            r.values[fieldName] = r.values[fieldName].decimal;
                                                        }

                                                        fields[`_${formDef.nameIndex[fieldName].id}`] = r.values[fieldName];
                                                    });
                                                    fields.server_sync = true;
                                                    fields.server_exists = true;

                                                    // just blow it in there n' hope for the best eh?
                                                    that.remulator.createRow({
                                                        table: `remulator.${formDef.table_name}`,
                                                        fields: fields
                                                    }).then((cr) => {

                                                        // if we had attachments, go push 'em
                                                        let modFields = {};

                                                        Promise.all(Object.keys((r.values)).filter((fieldName) => {return(
                                                            (formDef.nameIndex[fieldName] instanceof Object) &&
                                                            (formDef.nameIndex[fieldName].datatype == "ATTACHMENT")
                                                        )}).map((fieldName) => {return(new Promise((_t, _b) => {

                                                            /*
                                                                r.values[fieldName] should be of this form
                                                                {
                                                                    name: <str>,
                                                                    sizeBytes: <int>,
                                                                    data: <blob>
                                                                }
                                                                ugh, gotta pull the blob into a Uint8Array .. grrr

                                                            */
                                                            r.values[fieldName].data.arrayBuffer().then((ab) => {
                                                                that.remulator.putFile({
                                                                    fileName: r.values[fieldName].name,
                                                                    data: new Uint8Array(ab),
                                                                    dbSchema: 'remulator'
                                                                }).then((putFileResp) => {
                                                                    modFields[`_${formDef.nameIndex[fieldName].id}`] = putFileResp.id;
                                                                    _t(true);
                                                                }).catch((error) => {
                                                                    console.log(error);
                                                                    _b(error)
                                                                });
                                                            }).catch((error) => {
                                                                console.log(`arrayBuffer threw?!: ${error}`);
                                                                _b(error);
                                                            });


                                                        }))})).then(() => {
                                                            if (Object.keys(modFields).length > 0){
                                                                that.remulator.modifyRow({
                                                                    table: `remulator.${formDef.table_name}`,
                                                                    fields: modFields,
                                                                    id: cr.id
                                                                }).then(() => {
                                                                    Promise.resolve().then(() => { recursor(idx + 1); });
                                                                }).catch((error) => {
                                                                    console.log(error);
                                                                })
                                                            }else{
                                                                Promise.resolve().then(() => { recursor(idx + 1); });
                                                            }
                                                        });
                                                    }).catch((error) => {
                                                        if (
                                                            (error.errorObject instanceof Object) &&
                                                            (error.errorObject.errorObject instanceof Object) &&
                                                            error.errorObject.errorObject.hasOwnProperty('message') &&
                                                            (error.errorObject.errorObject.message == "JWT expired")
                                                        ){
                                                            console.log('renewing remulator api key and trying again ...');
                                                            that.remulator.authenticate({
                                                                user: that._DOMElements.username.value,
                                                                password: that._DOMElements.pass.value
                                                            }).then((api) => {
                                                                that.remulator = api;
                                                                Promise.resolve().then(() => { recursor(idx); });
                                                            }).catch((error) => {
                                                                console.log(error);
                                                            });
                                                        }else{
                                                            console.log(error);
                                                        }
                                                    });

                                                }else{
                                                    _b(`can't parse server response for: ${queue[idx]}`);
                                                }

                                            }).catch((e) => {
                                                // you know what? fuck it, we're not givin up
                                                console.log(`recursing for error: ${e}`);
                                                Promise.resolve().then(() => { recursor(idx); });
                                            });
                                        }
                                    }
                                    recursor(0);

                                }).then(() => {
                                    theDillyYo.exit();
                                    //toot(true)
                                }).catch((error) => {
                                    boot(error);
                                });

                            }else{
                                boot(`count query, can't parse result: `, countRows);
                            }
                        }).catch((error) => {
                            boot(`count query fail: ${error}`);
                        });
                    }).catch((error) => {
                        boot(`formDef fetch fail: ${error}`);
                    });
                }else{
                    boot('no form selected');
                }
            }else{
                boot('remulator api is not present');
            }
        }else{
            boot(`remedy api not present`);
        }
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
