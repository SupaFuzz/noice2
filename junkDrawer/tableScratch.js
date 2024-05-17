/*
    tableScratch.js
    5/16/24 - Amy Hicox <amy@hicox.com>

    this is a copy of noiceCoreUITable.js where I remove code sections as I port
    them to wcTable.js
*/

import { noiceCoreUIElement, noiceCoreUIOverlay } from './noiceCoreUI.js';
import { noiceObjectCore } from './noiceCore.js';
import { noicePieChart } from './noicePieChart.js';

class noiceCoreUITable extends noiceCoreUIElement {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:                     1,
        _className:                   'noiceCoreUITable',
        _defaultFooterMessage:        null,

        exportFileName:               null,
    },defaults),callback);

    this.setup();

} // end constructor




/*
    setup()
*/
setup(){

    // pre-spawn the table preferences editor frame thingy
    that.prefEditorFrameThingy = new noiceCoreUIOverlay({
        getHTMLCallback: () => { return(`<div class="uiContainer" data-templatename="uiContainer" data-templateattribute="true" style="width:100%; height:100%;display:grid;align-content:center;justify-content:center;"><div>`); },
        fullscreen: true,
        zIndex: 2,
        classList: [ that.defaultPrefUIClass ]
    });
    that.prefEditorFrameThingy.DOMElement.style.overflow = "auto";

}




/*
    openPanel(DOMTree)
*/
openPanel(DOMTree){
    let that = this;
    if (DOMTree instanceof Element){
        that.prefEditorFrameThingy.append(that._DOMElements.uiContainer);
        that.prefEditorFrameThingy.uiContainer = DOMTree;
        requestAnimationFrame(() => {
            let d = that.prefEditorFrameThingy._DOMElements.uiContainer.getBoundingClientRect();
            that.DOMElement.style.minWidth = `${d.width}px`;
        });
    }else{
        throw(`${that._className} v${that._version} | openPanel() | invalid input`);
    }
}




/*
    closePanel()
*/
closePanel(){
    this.prefEditorFrameThingy.remove();
    this.DOMElement.style.minWidth = null;
}




/*
    openPrefEditor(evt)
    we are gonna open an embeded modal dialog that obscures the table
    CSS is up to you to make it look nice with transparencies and such
    into that embedded dialog we are going to place the output of
    this.getPrefEditor(), which in turn will either spit back whatever
    your configured getPrefEditorCallback() or the output of defaultPrefEditor()
*/
openPrefEditor(evt){
    let that = this;
    that._DOMElements.btnPrefs.dataset.open = (!(that._DOMElements.btnPrefs.dataset.open == 'true'));
    if (that._DOMElements.btnPrefs.dataset.open == 'true'){
        that.openPanel(that.getPrefEditor());
        that._DOMElements.btnExport.disabled = true;
    }else{
        that.closePanel();
        that._DOMElements.btnExport.disabled = false;
    }
}




/*
    userQuery({
        prompt: <str>, a title
        detail: <str>, detail text paragraph
        options: {<str>:<val>, ...} // es6 default hash key ordering ftw
    })
    display a modal dialog blocking the table with the specified options.
    resolve the promise with the textContent of the button that got selected
*/
userQuery(args){
    let that = this;
    return(new Promise((toot, boot) => {
        let div = document.createElement('div');
        div.className = that.userPromptClass;
        div.insertAdjacentHTML('afterbegin', `
            <h2 class="prompt"></h2>
            <p class="detail"></p>
            <div class="buttonContainer"></div>
        `);
        if (args.hasOwnProperty('prompt') && that.isNotNull(args.prompt)){
            div.querySelector('h2.prompt').textContent = args.prompt;
        }else{
            div.querySelector('h2.prompt').remove();
        }

        if (args.hasOwnProperty('detail') && that.isNotNull(args.detail)){
            if (args.detail instanceof Element){
                div.querySelector('p.detail').innerHTML = '';
                div.querySelector('p.detail').appendChild(args.detail);
            }else{
                div.querySelector('p.detail').textContent = args.detail;
            }
        }else{
            div.querySelector('p.detail').remove();
        }
        if (args.options instanceof Object){
            Object.keys(args.options).map((s) => {
                let btn = document.createElement('button');
                btn.textContent = s;
                btn.addEventListener('click', (evt) => {
                    that.closePanel();
                    that._DOMElements.footerButtonContainer.querySelectorAll('button').forEach((el) => { el.disabled = false; });
                    toot(args.options[s]);
                });
                return(btn);
            }).forEach((el) => { div.querySelector("div.buttonContainer").appendChild(el); })
        }
        that._DOMElements.footerButtonContainer.querySelectorAll('button').forEach((el) => { el.disabled = true; });
        that.openPanel(div);
    }));
}








/*
    openExportUI()
    returns a promise that resolves when the UI is closed
    in case you needed that etc.
*/
openExportUI(){
    let that = this;
    return(new Promise((toot, boot) => {
        that._DOMElements.btnExport.disabled = true;

        // make the export UI
        let div = document.createElement('div');
        div.className = that.exportUIClass;
        div.insertAdjacentHTML('afterbegin', `
            <h2 class="prompt">CSV Export</h2>
            <div class="detail">
                <div class="gfxContainer"></div>
                <div class="deets">
                    <span class="explainer"></span>
                    <div class="defaultColSelectorOption">
                        <input type="checkbox" id="selectedRowsOnlyCheckbox" ${(that.numSelectedRows == 0)?'disabled':''}/>
                        <label for="selectedRowsOnlyCheckbox" class="${(that.numSelectedRows == 0)?'disabled':''}">export selected rows only</label>
                    </div>
                </div>
            </div>
            <div class="buttonContainer">
                <a class="downloader"><button class="btnDownloadFile" disabled>download CSV export</button></a>
                <button class="btnClose">close</button>
            </div>
        `);
        let checkBox = div.querySelector(`#selectedRowsOnlyCheckbox`);
        let explainer = div.querySelector(`span.explainer`);
        let gfxContainer = div.querySelector(`div.gfxContainer`);
        let btnDownloadFile = div.querySelector('button.btnDownloadFile');
        let btnClose = div.querySelector('button.btnClose');
        let guh = div.querySelector('div.defaultColSelectorOption');
        let link = div.querySelector('a.downloader');

        // make the progres display pie chart
        let pie = new noicePieChart({
            showPieChart: true,
            size: '4em',
            pieCharts: [ { name: 'loading', fill:'rgba(6, 133, 135, .66)'} ],
            zIndex: 1
        }).append(gfxContainer);
        pie.badgeTxtDOMElement.style.fontSize = '1.8em';

        // btnClose hook
        btnClose.addEventListener('click', (evt) => {
            that.closePanel();
            that._DOMElements.btnExport.disabled = false;
            toot(true);
        });

        // checkbox hook
        checkBox.addEventListener('change', (evt) => { exportIt(); });

        // helper function does the business
        function exportIt(){
            // deactivate everything, build the export, setup the button and then unlock everything
            btnClose.disabled = true;
            btnDownloadFile.disabled = true;
            checkBox.disabled = true;

            that.getCSVExport(checkBox.checked, pie, explainer, link).then(() => {
                btnDownloadFile.disabled = false;
                btnClose.disabled = false;
                checkBox.disabled = (that.numSelectedRows == 0);
            }).catch((error) => {
                guh.remove();
                explainer.textContent = `export failed: ${error}`;
                btnDownloadFile.disabled = true;
                btnClose.disabled = false;
            });
        }

        // open the panel and show the export UI
        that.openPanel(div);

        // get initial export, set it up
        requestAnimationFrame(() => { exportIt(); });

    }));
}




/*
    getCSVExport(exportSelectedOnlyBool, pieChart, explainerEl, linkEl)
    export the table (or the selected rows if exportSelectedOnlyBool is hot)
    do this in batches of syncRowsBatchLimit length aligned to animationFrames
    because there might be a bajillion rows to deal with

    explainerEl is a span, put progress messages here

    linkEl is the link onto which we should put the big CSV export we build here
*/
getCSVExport(exportSelectedOnlyBool, pieChart, explainerEl, linkEl){
    let that = this;
    return(new Promise((toot, boot) => {

        // get syncRowsBatchLimit sized chunks of rows
        let chunks = [];
        let queue = Array.from(this._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}${(exportSelectedOnlyBool === true)?'[data-selected="true"]':''}`));
        let complete = queue.length;
        while (queue.length > 0){ chunks.push(queue.splice(0, this.syncRowsBatchLimit)); }
        let csvQueue = [];

        // get the header :-)
        csvQueue.push(that.encodeCSVRow(Array.from(that._DOMElements.headerRow.querySelectorAll(`span.${that.headerColClassName}`)).map((el) =>{ return(el.textContent); })));

        // basically we're doing what get data() would do but spitting out an array of csv encoded strings
        pieChart.updatePieChart('loading', 0);
        explainerEl.textContent = 'exporting ...';
        function recursor(idx){
            if (idx == chunks.length){
                // zip it 'n ship it yo!
                linkEl.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csvQueue.join("\n"));
                linkEl.download = that.isNotNull(that.exportFileName)?that.exportFileName:`csv_export_${that.epochTimestamp(true)}.csv`;
                pieChart.updatePieChart('loading', 0);
                pieChart.badgeTxt = '✔️';
                explainerEl.textContent = `export ready`;
                toot(true);
            }else{
                // get literally whatever columns are on screen, then get a CSV row from it and push it on the stack
                chunks[idx].forEach((rowEl) =>{
                    csvQueue.push(that.encodeCSVRow(Array.from(rowEl.querySelectorAll(`span.${that.dataRowColClassName}`)).map((el) =>{ return(el.textContent); })))
                });
                explainerEl.textContent = `exporting (${csvQueue.length} of ${complete})`;
                pieChart.updatePieChart('loading', ((csvQueue.length/complete)*100));
                requestAnimationFrame(() => { recursor(idx + 1); });
            }
        }
        recursor(0);
    }));
}




/*
    encodeCSVRow(array)
    convert the given array to a CSV-encoded string properly escaped and joined with ","
    and return the string. You might wanna use this in an array.map or something eh?

    NOTE this is yanked out of noiceApplicationCore but for *reasons* we need a separate
    instance here. Actually applicationCore probably isn't the best place for it.
    in fact, maybe some kinda noiceCSVUtil in noiceCore might be better but whatever
    gotta get this mess done
*/
encodeCSVRow(inp){
    let that = this;
    if (inp instanceof Array){

        // better performance?!
        return(that.decodeHTMLEntities(inp.map((col) => {
            col = `${col}`.replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '    ').replace(/\"/g, '""').replace(/\“/g, '""').replace(/\”/g, '""');
            if ((/\"/.test(col)) || (/,/.test(col))){
                col = `"${col}"`;
            }else if (/^\d+$/.test(col)){
                col = `="${col}"`;
            }else if (that.isNull(col)){
                col = '';
            }
            return(col);
        }).join(",")));

    }else{
        if (that.debug){ this.log(`${that._className} v${that._version} | encodeCSVRow() | input is not instance of Array | returning null`); }
        return('');
    }
}




/*
    decodeHTMLEntities(string)
    my google-fu tells me this is the most legit way to decode HTML entities in a string
    also stolen from noiceApplicationCore and I don't think it really belongs there but
    gotta get r dun
*/
decodeHTMLEntities(str){
    return(new DOMParser().parseFromString(str, "text/html").documentElement.textContent);
}




/*
    validation errors stuff
    here's what we're gonna do.

    rowElement.dataset.errors = <jsonData>
    encoded json data is this:
    {
        <column.name>: { <errorNumber>: <errorString>, ...}
    }

    so every col could have potentially multiple validation errors
    we're going to add/modify/delete these on the dataset.errors object here
    *then* call renderCells and let that handle whatever we're doing here
    think we need like a renderCellValidationError() or something with a default
    callback like we have for the other things so it's easily externally overridable

    this also begs the question of rows being born with validation errors
    and that could very well possibly be a legit thing.

    FML. I am SO TIRED of re-implementing this garbage.
    this is what like -- generation 5 or 6 of it? UUUUUUUUHHHHHHHHHHGGGGGGGG

    ok so while we're at it I guess:
    rowElement.dataset.haserrors: <bool>
    cellElement.dataset.haserrors: <bool>

    so we can do visual things at the css layer


*/


/*
    addValidationError(rowElement, cellElement, {errorNumber:<int>, error: <str>, warning:<bool (default:false)>})
*/
addValidationError(rowElement, cellElement, validationError){
    let that = this;
    if (
        (rowElement instanceof Element) &&
        (cellElement instanceof Element) &&
        (validationError instanceof Object) &&
        validationError.hasOwnProperty('errorNumber') &&
        (!(isNaN(parseInt(validationError.errorNumber))))  &&
        validationError.hasOwnProperty('error') &&
        that.isNotNull(validationError.error)
    ){
        // do the thang
        rowElement.dataset.haserrors = true;
        cellElement.dataset.haserrors = true;

        let errrs = {};
        if (rowElement.dataset.errors && that.isNotNull(rowElement.dataset.errors)){
            try {
                errrs = JSON.parse(rowElement.dataset.errors);
            }catch(e){
                if (that.debug){ console.log(`${that._className} v${that._version} | addValidationError() | ignored | failed parse of existing row.dataset.errors?: ${e}`); }
            }
        }

        if (! (errrs[cellElement.dataset.name] instanceof Object)){ errrs[cellElement.dataset.name] = {}; }
        errrs[cellElement.dataset.name][validationError.errorNumber] = validationError;
        rowElement.dataset.errors = JSON.stringify(errrs);

        that.renderCells(rowElement);
    }else{
        throw(`${that._className} v${that._version} | addValidationError() | invalid input`);
    }
}




/*
    removeValidationError(rowElement, cellElement, errorNumber)
*/
removeValidationError(rowElement, cellElement, errorNumber){
    let that = this;
    if (
        (rowElement instanceof Element) &&
        (cellElement instanceof Element) &&
        (!(isNaN(parseInt(errorNumber))))
    ){

        let errrs = {};
        if (rowElement.dataset.errors && that.isNotNull(rowElement.dataset.errors)){
            try {
                errrs = JSON.parse(rowElement.dataset.errors);
            }catch(e){
                if (that.debug){ console.log(`${that._className} v${that._version} | addValidationError() | ignored | failed parse of existing row.dataset.errors?: ${e}`); }
            }
        }
        if ((errrs[cellElement.dataset.name] instanceof Object) && (errrs[cellElement.dataset.name].hasOwnProperty(parseInt(errorNumber)))){
            delete(errrs[cellElement.dataset.name][errorNumber]);
            if (Object.keys(errrs[cellElement.dataset.name]).length == 0){ delete(errrs[cellElement.dataset.name]); }
            rowElement.dataset.errors = JSON.stringify(errrs);
        }
        cellElement.dataset.haserrors = (
            (errrs[cellElement.dataset.name] instanceof Object) &&
            (Object.keys(errrs[cellElement.dataset.name]).length > 0)
        );
        rowElement.dataset.haserrors = (rowElement.querySelectorAll(`span.${that.dataRowColClassName}[data-haserrors="true"]`).length > 0);

    }else{
        throw(`${that._className} v${that._version} | addValidationError() | invalid input`);
    }
}




/*
    clearValidationErrors(rowElement, cellElement)
*/
clearValidationErrors(rowElement, cellElement){
    let that = this;
    if (
        (rowElement instanceof Element) &&
        (cellElement instanceof Element)
    ){
        let errrs = null;
        if (rowElement.dataset.errors && that.isNotNull(rowElement.dataset.errors)){
            try {
                errrs = JSON.parse(rowElement.dataset.errors);
            }catch(e){
                if (that.debug){ console.log(`${that._className} v${that._version} | addValidationError() | ignored | failed parse of existing row.dataset.errors?: ${e}`); }
            }
        }
        if (errrs[cellElement.dataset.name] instanceof Object){
            delete(errrs[cellElement.dataset.name]);
            rowElement.dataset.errors = JSON.stringify(errrs);
            cellElement.dataset.haserrors = false;
            rowElement.dataset.haserrors = (rowElement.querySelectorAll(`span.${that.dataRowColClassName}[data-haserrors="true"]`).length > 0);
        }
    }else{
        throw(`${that._className} v${that._version} | clearValidationErrors() | invalid input`);
    }
}




/*
    clearAllValidationErrors(rowElement)
*/
clearAllValidationErrors(rowElement){
    let that = this;
    if ((rowElement instanceof Element)){
        rowElement.dataset.errors = JSON.stringify({});
    }else{
        throw(`${that._className} v${that._version} | clearAllValidationErrors() | invalid input`);
    }
}









}
export { noiceCoreUITable };
