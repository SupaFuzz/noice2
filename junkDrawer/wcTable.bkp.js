/*
    wcTable.js
    5/15/24 Amy Hicox <amy@hicox.com>

    this is a reimplementation of noiceCoreUITable as a webComponent
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcTable extends noiceAutonomousCustomElement {




static classID = wcTable;
static classAttributeDefaults = {

    // needs mapping
    label: { observed: true, accessor: true, type: 'str', value: '' },
    default_footer_message: { observed: true, accessor: true, type: 'str', value: null },
    allow_column_sort: { observed: true, accessor: true, type: 'bool', value: false },
    allow_cell_edit:  { observed: true, accessor: true, type: 'bool', value: false },
    select_mode: { observed: true, accessor: true, type: 'enum', values:['none','single','multiple'], value: 'none' },
    max_list_height: { observed: true, accessor: true, type: 'str', value: 'auto', forceAttribute: true },
    list_height: { observed: true, accessor: true, type: 'str', value: 'auto', forceAttribute: true },
    modify_all: { observed: true, accessor: true, type: 'enum', values:['auto','prompt'], value: 'auto' },
    sync_rows_batch_limit: { observed: true, accessor: true, type: 'int', value: 250 },

    // css props -- validated working 5/16/24 @ 1500
    show_footer: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    show_btn_prefs: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_btn_select_all: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_btn_select_none: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_btn_export: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_footer_message: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    show_row_nudge_buttons: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },

    // should not need further attention
    debug:  { observed: false, accessor: true, type: 'bool', value: false },

    /*
        ex:
        disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
        message: { observed: true, accessor: true, type: 'str', value: '' },
        size: { observed: true, accessor: true, type: 'int', value: 20 },
        options: { observed: true, accessor: true, type: 'json', key: 'values', value: []},
        wrap: { observed: true, accessor: true, type: 'enum', values:['hard','soft','off'], value: 'off' },
        value: { observed: true, accessor: true, type: 'float', value: 1.618 },
    */
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(args){
    super(args);
    this._className = 'wcTable';
    this._version = 1;

    /*
        NOTE: all of these inits are gonna clobber inputs om args
        that got merged by super().

        this needs to be reconfigured into some kinda merge if not there already kinda logic
        but later. For now this is at least a leaderboard of what we've got ported so far
    */

    // internal classNames
    this.headerColClassName          = 'hdrCol';
    this.headerRowClassName          = 'hdrRow';
    this.dataRowClassName            = 'listRow';
    this.dataRowColClassName         = 'listCol';
    this.defaultCellEditorInputClass = 'cellEditor';
    this.defaultPrefUIClass          = 'tablePrefEditor';
    this.defaultPrefUIEditorClass    = 'defaultPrefUIEditor';
    this.userPromptClass             = 'userPrompt';
    this.exportUIClass               = 'exportUI';


    // stubs for callbacks
    this.rowSelectCallback = null;
    this.renderRowsProgressCallback = null;
    this.getFooterMessageCallback = null;
    this.getPrefEditorCallback = null;
    this.modifyRowCallback = null;

    // stubs for internal getter/setters
    this._customButtons = [];
    this._columns       = [];
    this._rows          = [];
    this._data          = [];

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        /*
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcTable.classAttributeDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;

    div.innerHTML =
       `<div class="label" data-templatename="label" data-templateattribute="true"></div>
        <div data-templatename="uiContainer" data-templateattribute="true" style="">
            <div class="tableContainer" data-templatename="tableContainer">
                <div class="tableHeader ${this.headerRowClassName}" data-templatename="tableHeader" data-templateattribute="true">
                    <div data-templatename="headerRow" data-templateattribute="true"></div>
                </div>
                <div class="tableListContainer" data-templatename="tableListContainer" data-templateattribute="true"></div>
            </div>
        </div>
        <div class="footer" data-templatename="footer" data-templateattribute="true">
            <div class="buttonContainer" data-templatename="footerButtonContainer">
                <button class="btnPrefs txtBtn" data-templatename="btnPrefs" data-templateattribute="true">columns</button>
                <button class="btnSelectAll txtBtn" data-templatename="btnSelectAll" data-templateattribute="true" disabled>select all</button>
                <button class="btnSelectNone txtBtn" data-templatename="btnSelectNone" data-templateattribute="true" disabled>select none</button>
                <button class="btnExport txtBtn" data-templatename="btnExport" data-templateattribute="true" disabled>export</button>
                <button class="btnNudgeUp txtBtn" data-templatename="btnNudgeUp" data-templateattribute="true" disabled>&#9650;</button>
                <button class="btnNudgeDown txtBtn" data-templatename="btnNudgeDown" data-templateattribute="true" disabled>&#9660;</button>
            </div>
            <div class="footerMessage" data-templatename="footerMessage" data-templateattribute="true"></div>
        </div>`;

    // snarf the ._elements
    Array.from(div.querySelectorAll('[data-templateattribute="true"]')).filter((el) =>{return(this.isNotNull(el.dataset.templatename))}, this).forEach((el) => {
        this._elements[el.dataset.templatename] = el;
    }, this);

    // alias ._elements to ._DOMElements for the sake of the laze
    this._DOMElements = this._elements;

    /*
        5/15/24 @ 2209 - none of these functions exist yet
    that._DOMElements.btnPrefs.addEventListener('click', (evt) => { that.openPrefEditor(evt); that._DOMElements.btnPrefs.blur(); });
    that._DOMElements.btnSelectAll.addEventListener('click', (evt) => { that.handleSelectAll(evt); that._DOMElements.btnSelectAll.blur(); });
    that._DOMElements.btnSelectNone.addEventListener('click', (evt) => { that.handleSelectNone(evt); that._DOMElements.btnSelectNone.blur(); });
    that._DOMElements.btnExport.addEventListener('click', (evt) => { that.openExportUI(evt); that._DOMElements.btnExport.blur(); });
    that._DOMElements.btnNudgeUp.addEventListener('click', (evt) => { that.nudgeSelection('up', 1); that._DOMElements.btnNudgeUp.blur(); });
    that._DOMElements.btnNudgeDown.addEventListener('click', (evt) => { that.nudgeSelection('down', 1); that._DOMElements.btnNudgeDown.blur(); });
    */

    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    /*
        doeth thine settting up things here
    */
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
    }
    div[data-templatename="uiContainer"] {
        position: relative;
        width: 100%;
    }
    div[data-templatename="footer"] {
        grid-template-columns: auto auto;
        align-items: center;
    }
    div[data-templatename="footer"] div.buttonContainer {
        text-align: left;
    }
    div[data-templatename="footerMessage"] {
        overflow: auto;
    }
    div[data-templatename="tableListContainer"] {
        display: grid;
        scrollbar-width: thin;
        scrollbar-gutter: stable;
        overflow-y: auto;
        min-width: fit-content;
        align-content: baseline;
    }
    div[data-templatename="headerRow"] {
        scrollbar-width: thin;
        scrollbar-gutter: stable;
    }
    div[data-templatename="tableContainer"] {
        scrollbar-width: thin;
    }

    :host([show_footer="false"]) div[data-templatename="footer"]{
        display: none;
    }

    /* visibility toggles */
    :host([show_footer="false"]) div[data-templatename="footer"],
    :host([show_btn_prefs="false"]) div[data-templatename="footerButtonContainer"] button.btnPrefs,
    :host([show_btn_select_all="false"]) div[data-templatename="footerButtonContainer"] button.btnSelectAll,
    :host([show_btn_select_none="false"]) div[data-templatename="footerButtonContainer"] button.btnSelectNone,
    :host([show_btn_export="false"]) div[data-templatename="footerButtonContainer"] button.btnExport,
    :host([show_footer_message="false"]) div[data-templatename="footerMessage"],
    :host([show_row_nudge_buttons="false"]) div[data-templatename="footerButtonContainer"] button.btnNudgeUp,
    :host([show_row_nudge_buttons="false"]) div[data-templatename="footerButtonContainer"] button.btnNudgeDown
    {
        display: none;
    }

    /* ported styles NOTE: gonna need some vars up in this yo! */
    .tableContainer {
       box-shadow: 2px 2px 2px rgba(20, 22, 23, .3) inset;
       background: radial-gradient(ellipse at center, rgb(150, 167, 173), rgba(150, 167, 173, .6));
       color: rgb(24, 35, 38);
       padding: .25em;
       border-radius: .5em;
    }
    .hdrRow,.listRow {
       margin-bottom: .128em;
    }
    .hdrRow .hdrCol {
       border: 1px solid rgb(36, 36, 36);

       padding: .25em .128em .128em .25em;
       background-color: rgba(36, 36, 36,.1);
       border-radius: .25em;
    }
    .hdrRow .hdrCol[data-sort="descending"]:before {
       content: '\\25BC';
       opacity: .5;
       font-size: .8em;
    }
    .hdrRow .hdrCol[data-sort="ascending"]:before {
       content: '\\25B2';
       opacity: .5;
       font-size: .8em;
    }
    .hdrRow .hdrCol, .listRow .listCol {
       margin-right: .128em;
       padding: 0 .128em 0 .25em;
    }
    .listRow span.listCol {
       font-size: .8em;
    }
    .listRow span.listCol[data-locked="true"] {
       opacity: .4;
       text-decoration: line-through;
       background-color: rgba(24, 35, 38, .2);
    }
    .listRow[data-selected="true"] {
       background-color: rgba(240, 240, 240,.8);
       filter: invert(.85);
    }
    .footerMessage {
       font-size: .8em;
       font-family: Comfortaa;
       padding-right: .25em;
    }
    .label{
       font-family: Comfortaa;
       padding-left: .25em;
       font-weight: bold;
    }
    .footer .buttonContainer .btnPrefs[data-open="true"]{
       opacity: .5;
    }
    .footer .buttonContainer .btnPrefs {
       background: transparent;
       border-color: transparent;
       color: rgb(240, 240, 240);
       font-size: 1em;
    }
    .footer .buttonContainer button.txtBtn {
        background-color: transparent;
        color: rgb(240, 240, 240);
        border: .128em solid rgb(240, 240, 240);
        border-radius: 1em;
        font-size: .55em;
        height: min-content;
        margin-right: .5em;
    }
    .footer .buttonContainer button.txtBtn:active {
        background-color: rgb(240, 240, 240);
        color: rgb(22, 23, 25);
    }
    .footer .buttonContainer button.txtBtn:disabled {
       opacity: .2;
    }
    .tablePrefEditor, .userPrompt, .exportUI {
       background-color: rgba(24, 35, 38, .66);
       border-radius: .5em;
    }
    .defaultPrefUIEditor fieldset
       display: grid;
       grid-template-columns: 1fr 1fr 1fr 1fr;
       text-align: left;
       color: rgb(240,240,240);
       background-color: rgba(24, 35, 38, .66);
       border-radius: 1em
    }
    .defaultPrefUIEditor fieldset legend {
       font-family: Comfortaa;
       font-weight: bolder;
       font-size: 1.5em;
    }
    .defaultPrefUIEditor .btnContiner {
        width: 100%;
        text-align: right;
    }
    .defaultPrefUIEditor button.btnClose {
       margin-right: 1.5em;
       margin-top: .25em;
       font-family: Comfortaa;
       background: url('./gfx/cancel-icon-light.svg');
       background-repeat: no-repeat;
       background-size: contain;
       padding-left: 1.5em;
       color: rgb(240, 240, 240);
       border: none;
    }
    .userPrompt {
       padding: 1em;
       border: .128em solid rgba(240, 240, 240, .8);
    }
    .userPrompt h2.prompt, .exportUI h2.prompt {
       margin: 0;
       font-family: Comfortaa;
    }
    .userPrompt div.buttonContainer, .exportUI div.buttonContainer {
       text-align: center;
    }
    .userPrompt div.buttonContainer button, .exportUI div.buttonContainer button {
       font-family: Comfortaa;
       font-size: .8em;
       padding: .25em .5em .25em .5em;
       margin: .8em;
       border-radius: .5em;
       background-color: rgba(240, 240, 240 .8);
       border: .128em solid rgb(20, 22, 23);
       color: rgb(20, 22, 23);
    }
    .exportUI {
       border: .128em solid rgb(240, 240, 240);
       padding: 1em;
       display: grid;
    }
    .exportUI .detail .chartBknd {
       fill: rgb(24, 35, 38);
       stroke: rgba(240, 240, 240, .8);
       stroke-width: 2px;
    }
    .exportUI .detail {
       display: grid;
       grid-template-columns: 4em auto;
       align-items: center;
       margin: 1em;
    }
    .exportUI .detail .deets {
       margin-left: .5em;
       display: grid;
    }
    .exportUI .detail .deets .explainer {
       font-style: italic;
       font-size: .8em;
       margin-bottom: .25em
    }
    .exportUI .detail .deets label {
       font-family: Comfortaa;
    }
    .exportUI .detail .deets label.disabled {
      opacity: .25;
    }


`)};




/*
    ported functions
*/




/*
    maxListHeight attribute
    if not set, the height of the rendered table is unbounded
    if that's not what you want you can set the max-height CSS
    attribute of this.tableListContainer in any supported CSS units you like
    this will provoke the scrollbar and sticky header via the hard-coded CSS
*/
get maxListHeight(){
    return(this._DOMElements.tableListContainer.style.maxHeight);
}
set maxListHeight(v){
    this._DOMElements.tableListContainer.style.height = null;
    this._DOMElements.tableListContainer.style.maxHeight = v;
}
get listHeight(){
    return(this._DOMElements.tableListContainer.style.height);
}
set listHeight(v){
    this._DOMElements.tableListContainer.style.maxHeight = null;
    this._DOMElements.tableListContainer.style.height = v;
}



/*
    numRows attribute
    return the number of data rows in the table
*/
get numRows(){
    return(this._DOMElements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}`).length);
}




/*
    numSelectedRows attribute
    return the number of data rows in the table
*/
get numSelectedRows(){
    return(this._DOMElements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}[data-selected="true"]`).length);
}







/*
    customButtons
    [{name: <str>, callback: function(tableRef, btnRef)}, ...]
*/
get customButtons(){ return(this._customButtons); }
set customButtons(v){
    let that = this;
    if (v instanceof Array){

        // remove any existing custom buttons
        that._DOMElements.footerButtonContainer.querySelectorAll('button.customButton').forEach((el) => { el.remove(); });

        // add the new ones
        v.filter((a)=>{return(
            (a instanceof Object) &&
            a.hasOwnProperty('name') &&
            that.isNotNull(a.name) &&
            (a.callback instanceof Function)
        )}).map((a) => {
            let btn = document.createElement('button');
            btn.classList.add('customButton', 'txtBtn');
            btn.textContent = a.name;
            btn.addEventListener('click', (evt) => { a.callback(that, btn); btn.blur();});
            return(btn);
        }).forEach((el) => {
            that._DOMElements.footerButtonContainer.appendChild(el);
        });

        that._customButtons = v;
    }
}




/*
    rows attribute
    get and set rows as an array of objects
    note setter replaces all existing rows
    and yeah we're gonna do it in batches on animationFrames so rendering
    gigantor tables doesn't smurf the UI thread
*/
get rows(){
    return(Array.from(this._DOMElements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}`)).map((el) => {
        return(JSON.parse(el.dataset.rowdata))
    }));
}
set rows(v){
    let that = this;
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Object)}).length)
    ){
        that._DOMElements.tableListContainer.innerHTML = '';
        let chunks = [];
        let complete = v.length;
        let doneCount = 0;
        while (v.length > 0){ chunks.push(v.splice(0, this.syncRowsBatchLimit)); }
        function recursor(idx){
            if (idx == chunks.length){
                return(true);
            }else{
                chunks[idx].forEach((row) => {
                    that.addRow(row, true);
                    doneCount ++;
                });
                requestAnimationFrame(() => {
                    if (that.renderRowsProgressCallback instanceof Function){
                        try {
                            that.renderRowsProgressCallback(doneCount, complete, that);
                        }catch(e){
                            if (that.debug){ console.log(`${that._className} v${that._version} | rows attribute setter | ignored | renderRowsProgressCallback threw unexpectedly: ${e}`); }
                        }
                    }
                    recursor((idx + 1));
                });
            }
        }
        recursor(0);
    }else{
        throw(`${that._className} v${that._version} | rows attribute setter | invalid input format`);
    }
}



/*
    applyRowCSS(rowElement)
    calculate grid-template-columns and apply it to the specified row
    this is the "use CSS to make it look like an old school table" part
*/
applyRowCSS(el){
    let that = this;
    if (el instanceof Element){
        el.style.display    = 'grid';
        el.style.cursor     = 'default';
        el.style.userSelect = 'none';
        el.style.width      = '100%';
        el.style.height     = 'max-content';
        el.style.gridTemplateColumns = that.columns.filter((a)=>{return(a.visible === true)}).sort((a,b) => {return(a.order - b.order)}).map((col) => {
            let width = ((col instanceof Object) && col.hasOwnProperty('width') && that.isNotNull(col.width))?col.width:1;
            return(`${width}${/^\d+$/.test(width)?'fr':''}`);
        }).join(" ");
    }
}




/*
    syncRows(progressCallback)
    update every single row by calling renderCells on it
    (which in turn calls applyRowCSS)

    this executes on animationFrames, we batch rows into
    gropus of this.sync_rows_batch_limit

    as such it is async. We will call progressCallback(partial, complete, selfReference)
    if specified.
*/
syncRows(progressCallback){
    let that = this;
    return(new Promise((toot, boot) => {
        let chunks = [];
        let queue = Array.from(this._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`));
        let complete = queue.length;
        while (queue.length > 0){ chunks.push(queue.splice(0, this.sync_rows_batch_limit)); }
        let doneCount = 0;
        function recursor(idx){
            if (idx == chunks.length){
                toot(true);
            }else{
                chunks[idx].forEach((el) => {
                    that.renderCells(el);
                    doneCount ++;
                });
                requestAnimationFrame(() => {
                    if (progressCallback instanceof Function){
                        try {
                            progressCallback(doneCount, complete, that);
                        }catch(e){
                            if (that.debug){ console.log(`${that._className} v${that._version} | syncRows() | ignored | progressCallback threw unexpectedly: ${e}`); }
                        }
                    }
                    recursor((idx + 1));
                })
            }
        }
        recursor(0);
    }));
}




/*
    renderCells(rowElement)
    create cells from rowElement.rowdata keys that have corresponding
    column definitions, in the proper order. Kill ones that shouldn't be there
    spawn ones that are missing. You get it.
*/
renderCells(rowElement){
    let that = this;
    if ((rowElement instanceof Element) && (rowElement.dataset.rowdata)){
        let data = null;
        try {
            data = JSON.parse(rowElement.dataset.rowdata);
        }catch(e){
            throw(`${this._className} v${this._version} | renderCells(${rowElement.dataset.rownum}) | failed to parse rowdata: ${e}`);
        }

        // remove columns we shouldn't have
        Array.from(rowElement.querySelectorAll(`span.${that.dataRowColClassName}`)).filter((el) =>{return(
            that.columns.filter((b)=>{return((b.name == el.dataset.name) && (b.visible === true))}).length == 0
        )}).forEach((el) =>{ el.remove(); });

        // spawn columns we're missing or update them if they're not -- in order which should make sure they're sorted properly (horizontally)
        that.columns.filter((a)=>{return(a.visible === true)}).sort((a,b) => {return(a.order - b.order)}).forEach((col) =>{
            let el = rowElement.querySelector(`span.${that.dataRowColClassName}[data-name="${col.name}"]`);
            if (el instanceof Element){
                el.textContent = data.hasOwnProperty(col.name)?data[col.name]:'';
                // insures we're in the right order
                rowElement.appendChild(el);

            }else{
                let span = document.createElement('span');
                span.className = that.dataRowColClassName;
                span.dataset.name = col.name;
                span.dataset.locked = false;
                if (col.hasOwnProperty('fieldId')){ span.dataset.fieldid = col.fieldId; }
                span.textContent = data.hasOwnProperty(col.name)?data[col.name]:'';
                span.style.overflow = "hidden";
                span.addEventListener('dblclick', (evt) => {
                    if (
                        (! (rowElement.dataset.locked == 'true')) &&
                        (that.allow_cell_edit == true)
                    ){
                        rowElement.dataset.locked = true;
                        that.handleCellEdit(rowElement, span).then(() => { rowElement.dataset.locked = false; }).catch((error) => {
                            rowElement.dataset.locked = false;
                            throw(`${that._className} v${that._version} | cell edit click handler | handleCellEdit() threw unexpectedly: ${error}`);
                        });
                    }
                })
                rowElement.appendChild(span);
            }
        });
        that.applyRowCSS(rowElement);

    }else{
        throw(`${this._className} v${this._version} | renderCells() | invalid input`);
    }
}




/*
    columns attribute
*/
get columns(){ return(this._columns); }
set columns(v){
    let that = this;
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Object) && a.hasOwnProperty('name') && that.isNotNull(a.name)}).length)
    ){



        // this is *the* set of columns meaning we blow away whatever was there
        that._columns = [];
        that._DOMElements.headerRow.innerHTML = '';

        // aight! holonnaurbutts ... note addCol will push this._columns for us
        v.forEach((col) => {
            try {
                that.addColumn(col, false);
            }catch(e){
                throw(`${that._className} v${that._version} | columns attribute setter | addColumn() threw unexpectedly for ${col.name} | ${e}`);
            }
        });

        // setup the css
        that.applyRowCSS(that._DOMElements.headerRow);

        // the cols are added, sync the rows
        that.syncRows();

    }else{
        throw(`${that._className} v${that._version} | columns attribute setter | invalid input format`);
    }
}




/*
    addColumn(col, propagateBool)
    add the column, syncRows if propagateBool is true
*/
addColumn(col, propagateBool){
    let that = this;
    if (
        (col instanceof Object) &&
        col.hasOwnProperty('name') &&
        that.isNotNull(col.name) &&
        (that.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == col.name))}).length == 0)
    ){
        // set default column order
        if (!(col.hasOwnProperty('order') && (! isNaN(parseInt(col.order))))){ col.order = that._columns.length + 1; }

        let span = that.getHeaderCell(col);
        col.visible = col.hasOwnProperty('visible')?(col.visible === true):true;
        that._columns.push(col);
        if (col.visible === true){
            that._DOMElements.headerRow.appendChild(span);
            that.applyRowCSS(that._DOMElements.headerRow);
            if (propagateBool === true){ that.syncRows(); }
        }else{
            col._el = span;
        }

    }else{
        throw(`${that._className} v${that._version} | addColumn() | invalid input`);
    }
}




/*
    cellEditor attribute returns
    editCellCallback (if specified) or defaultCellEditCallback
*/
get cellEditor(){ return( (this.editCellCallback instanceof Function)?this.editCellCallback:this.defaultCellEditCallback); }




/*
    defaultCellEditCallback(rowElement, cellElement, selfRef)
    if no cellEditCallback is specified at object instantiation
    but allowEdit is set true, we will use this default cell editor
    it's kinda barebones and dumb. You might wanna use this as a
    tempate for building one a little fancier
*/
defaultCellEditCallback(rowElement, cellElement, selfRef){
    let that = this;
    return(new Promise((toot, boot) => {

        let c = cellElement.getBoundingClientRect();

        let inp = document.createElement('input');
        inp.setAttribute('type', 'text');
        inp.value = cellElement.textContent;
        inp.style.width = `${(c.width - 4)}px`;
        inp.className = that.defaultCellEditorInputClass;

        inp.addEventListener('focusout', (evt) => {

            // so-dumb-it-actually-works xss filter
            let bs = document.createElement('div');
            bs.textContent = inp.value;
            inp.remove();
            toot(bs.innerHTML);

        });
        inp.addEventListener('keydown', (evt) => {
            if (evt.keyCode == 13){ inp.blur(); }
        });

        cellElement.innerHTML = '';
        cellElement.appendChild(inp);
        inp.focus();
    }));
}



/*
    handleCellEdit(rowElement, cellElement)
    if allow_cell_edit: true, and editCellCallback is specified, call it and await output
    if resolved promise, send returned value to modifyRow() and let it call the modifyRowCallback() if specified
*/
handleCellEdit(rowElement, cellElement){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (that.allow_cell_edit == true) &&
            (that.cellEditor instanceof Function) &&
            (that.columns.filter((a)=>{return(
                (a.name == cellElement.dataset.name) && (! (a.hasOwnProperty('disableCellEdit') && (a.disableCellEdit === true)))
            )}).length == 1) &&
            (cellElement instanceof Element)
        ){
            if ((!(
                (cellElement.dataset) &&
                (cellElement.dataset.locked) &&
                (cellElement.dataset.locked == "true")
            ))){

                // do all the things
                let undoValue = cellElement.textContent;
                that.cellEditor(rowElement, cellElement, that).then((value) => {

                    // if we're in modify mode and modify_all: prompt is set ...
                    new Promise((_t,_b) => {

                        let colRef = that.columns.filter((a) => {return(a.name == cellElement.dataset.name)})[0];
                        let dma = ((colRef instanceof Object) && colRef.hasOwnProperty('disableModifyAll') && (colRef.disableModifyAll == true));

                        if ((that.select_mode == 'multiple') && (that.numSelectedRows > 1) && (! dma)){
                            if (that.modify_all == "prompt"){
                                let grr = {};
                                grr[`Modify ${that.numSelectedRows} Rows`] = 'all';

                                that.userQuery({
                                    prompt: `Modify All Rows?`,
                                    detail: `You have changed the value of '${cellElement.dataset.name}', copy this change to all ${that.numSelectedRows} selected rows?`,
                                    options: Object.assign(grr, {
                                        'Only This Row': 'selfOnly',
                                        'Undo': null
                                    })
                                }).then((userResponse) => {
                                    if (that.isNull(userResponse)){
                                        _b('undo');
                                    }else{
                                        _t(userResponse == 'all');
                                    }
                                });
                            }else if (that.modify_all == "auto"){
                                _t('all');
                            }else{
                                _t('selfOnly');
                            }
                        }else{
                            _t('selfOnly');
                        }
                    }).then((copyAllBool) => {


                        /*
                            if copyAllBool is hot, copy all the other rows
                            if copyAllBool is chill, just modify the one row
                        */
                        if (copyAllBool == true){

                            let rowQueue = that.getSelected();
                            function recursor(idx){
                                if (idx == rowQueue.length){
                                    toot(true);
                                }else{
                                    let ce = rowQueue[idx].DOMElement.querySelector(`.${that.dataRowColClassName}[data-name='${cellElement.dataset.name}']`);
                                    if (ce instanceof Element){
                                        that.modifyCellValue(rowQueue[idx].DOMElement, ce, value).then(() => {
                                            requestAnimationFrame(() => {recursor(idx + 1); });
                                        }).catch((error) => {
                                            if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | modifyCellValue() threw unexpectedly on rownum: ${rowQueue[idx].DOMElement.dataset.rownum}: ${error}`); }
                                            boot(error);
                                        });
                                    }
                                }
                            }
                            recursor(0);

                        }else{
                            that.modifyCellValue(rowElement, cellElement, value).then(() => {
                                toot(true);
                            }).catch((error) => {
                                if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | modifyCellValue() threw unexpectedly: ${error}`); }
                                boot(error);
                            });
                        }


                    }).catch((error) => {
                        // user query threw. this means undo
                        cellElement.textContent = undoValue;
                        toot(false);
                    });
                }).catch((error) => {
                    if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | editCellCallback() threw unexpectedly: ${error}`); }
                    boot(error);
                });

            }else if (
                (cellElement.dataset) &&
                (cellElement.dataset.locked) &&
                (cellElement.dataset.locked == "true")
            ){
                if (
                    cellElement.dataset.lockmessage &&
                    that.isNotNull(cellElement.dataset.lockmessage)
                ){
                    // pop the note about why it can't be edited
                    that.userQuery({
                        prompt: `Cell cannot be edited`,
                        detail: cellElement.dataset.lockmessage,
                        options: { ok: true }
                    }).then(() => {
                        toot(false);
                    })
                }else{
                    if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | cell is locked`); }
                    toot(false);
                }
            }
        }else{
            if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | cellEdit disabled`); }
            toot(false);
        }
    }));
}




/*
    updateFooterMessage()
*/
updateFooterMessage(){
    this._DOMElements.footerMessage.innerHTML = '';
    this._DOMElements.footerMessage.appendChild(this.getFooterMessage());
}




/*
    getFooterMessage()
*/
getFooterMessage(){
    let that = this;

    // does this belong here? no
    // does every other part of the code that could affect a row select end up calling this: yes
    // they say you can fix anything with duct tape and determination, y'know?
    if(that.show_btn_select_none){that._DOMElements.btnSelectNone.disabled = (this.numSelectedRows < 1);}
    if(that.show_btn_select_all){that._DOMElements.btnSelectAll.disabled = (this.numRows == this.numSelectedRows);}
    if(that.show_btn_export){that._DOMElements.btnExport.disabled = (this.numRows == 0);}
    if (that.show_row_nudge_buttons){
        if (this.numSelectedRows > 0){
            let selected = that.getSelected();
            let min = (Array.from(this._DOMElements.tableListContainer.children).indexOf(selected[0].DOMElement) + 1);
            let max = (Array.from(this._DOMElements.tableListContainer.children).indexOf(selected[(selected.length -1)].DOMElement) + 1);

            // disable up nudge if the minimum selected row is at top
            that._DOMElements.btnNudgeUp.disabled = (min == 1);

            // disable nudge down if the max selected row is at bottom
            that._DOMElements.btnNudgeDown.disabled = (max == that.numRows);

        }else{
            that._DOMElements.btnNudgeUp.disabled = true;
            that._DOMElements.btnNudgeDown.disabled = true;
        }
    }

    // oh yes, and also the actual code that belongs here ...
    if (that.getFooterMessageCallback instanceof Function){
        return(that.getFooterMessageCallback(that));
    }else{
        return(that.defaultFooterMessage);
    }
}




/*
    defaultFooterMessage (DOMTree)
*/
get defaultFooterMessage(){
    let div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = "row-reverse";
    div.insertAdjacentHTML('afterbegin', `
        <div class="section" data-name="selected">, <span class="value">${this.numSelectedRows}</span> selected</div>
        <div class="section" data-name="count"><span class="value">${this.numRows}</span> rows</div>
    `);
    return(div);
}




/*
    getPrefEditor()
    return DOM tree for the table preferences editor
    if no getPrefEditorCallback specified,return this.defaultPrefEditor
*/
getPrefEditor(){
    return((this.getPrefEditorCallback instanceof Function)?this.getPrefEditorCallback(this):this.defaultPrefEditor)
}




/*
    defaultPrefEditor (DOM tree, read-only)
*/
get defaultPrefEditor(){
    let that = this;
    let div = document.createElement('div');
    div.className = this.defaultPrefUIEditorClass;

    // am feelin quite lazy
    div.innerHTML = `
        <fieldset>
            <legend>select columns</legend>
            ${
                that.columns.sort((a,b) => {return(a.order - b.order)}).map((a) =>{
                    let guid = that.getGUID();
                    return(`
                        <div class="defaultColSelectorOption" data-id="${guid}">
                            <input type="checkbox" data-colname="${a.name}" id="${guid}" ${(a.visible === true)?'checked':''} />
                            <label for="${guid}">${a.name}</label>
                        </div>
                    `);
                }).join("")
            }
        </fieldset>
        <div class="btnContainer"><button class="btnClose">close</button></div>
    `;
    div.querySelectorAll('input').forEach((el) => {
        el.addEventListener("change", (evt) => {
            that.toggleColumnVisibility(el.dataset.colname, el.checked);
        });
    });
    div.querySelector('button.btnClose').addEventListener("click", (evt) => {
        that._DOMElements.btnPrefs.click();
    });
    return(div);
}




/*
    removeColumn(colName, propagateBool)
    delete the specified column, syncRows is propagateBool is true
*/
removeColumn(colName, propagateBool){
    let that = this;
    if (
        that.isNotNull(colName) &&
        (that.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == colName))}).length == 1)
    ){
        // remove column from UI
        let el = that._DOMElements.headerRow.querySelector(`span.${that.headerColClassName}[data-name="${colName}"]`);
        if (el instanceof Element){ el.remove(); }

        // remove it from the internal column list
        this._columns = this._columns.filter((a) => {return(!((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == colName)))});

        // sync the rows if we have the flag
        that.applyRowCSS(that._DOMElements.headerRow);
        if (propagateBool === true){ that.syncRows(); }

    }else{
        throw(`${that._className} v${that._version} | removeColumn() | invalid input`);
    }
}




/*
    toggleColumnVisibility(colName, visibilityBool)
    same thing as removeColumn, except don't actually remove it from columns
*/
toggleColumnVisibility(colName, visibilityBool){
    let that = this;
    if (
        that.isNotNull(colName) &&
        (that.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == colName))}).length == 1)
    ){
        let colObject = that.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == colName))})[0];
        if (visibilityBool === false){

            // remove column from UI, cheekily
            let el = that._DOMElements.headerRow.querySelector(`span.${that.headerColClassName}[data-name="${colName}"]`);
            if (el instanceof Element){
                colObject._el = el;
                el.remove();
            }

        }else{

            // with an equally cheeky disposition, add it back
            let ord = that.columns.sort((a,b)=>{return(a.order - b.order)}).map(a=>{return(a.name)});
            that._DOMElements.headerRow.appendChild((colObject._el instanceof Element)?colObject._el:that.getHeaderCell(colObject));
            Array.from(that._DOMElements.headerRow.querySelectorAll(`span.${that.headerColClassName}`)).sort((a,b) => {return(
                ord.indexOf(a.dataset.name) - ord.indexOf(b.dataset.name)
            )}).forEach((el) => {that._DOMElements.headerRow.appendChild(el); });
        }

        // remove it from the internal column list
        that.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == colName))})[0].visible = (visibilityBool === true);

        // sync the rows if we have the flag
        that.applyRowCSS(that._DOMElements.headerRow);
        that.syncRows();

    }else{
        throw(`${that._className} v${that._version} | toggleColumnVisibility(${colName}, ${visibilityBool == true}) | invalid input`);
    }
}




/*
    getHeaderCell(column)
*/
getHeaderCell(col){
    let that = this;
    let span = document.createElement('span');
    span.className = that.headerColClassName;
    span.dataset.name = col.name;
    span.dataset.sort = 'none';
    span.textContent = col.name;
    span.addEventListener('click', (evt) => { that.handleColumnSort(span); });
    return(span);
}




/*
    handleColumnSort(headerColumnElement)
*/
handleColumnSort(hdrColEl){
    let that = this;
    if (that.allowColumnSort === true){
        if (that.debug){ console.log(`${that._className} v${that._version} | handleColumnSort(${hdrColEl.dataset.name}) | called`); }

        // it's a three way toggle: none | ascending | descending
        let modes = ['none','ascending','descending'];
        hdrColEl.dataset.sort = modes[
            (((modes.indexOf(hdrColEl.dataset.sort) + 1) > modes.length -1) || (modes.indexOf(hdrColEl.dataset.sort) < 0))?0:(modes.indexOf(hdrColEl.dataset.sort) + 1)
        ];
        let colObj = that.columns.filter((a)=>{return(a.name == hdrColEl.dataset.name)})[0];

        // ok when unsetting the sort we don't really do anything until all of the cols are sorted none, then we restore the original sort order
        if (hdrColEl.dataset.sort == "none"){
            if (Array.from(that._DOMElements.tableHeader.querySelectorAll(`span.${that.headerColClassName}:not([data-sort="none"])`)).length == 0){
                Array.from(that._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`)).sort((a,b) => {
                    return(parseInt(a.dataset.rownum) - parseInt(b.dataset.rownum))
                }).forEach((el) => {
                    that._DOMElements.tableListContainer.appendChild(el);
                })
            }
        }else{
            Array.from(that._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`)).sort((a,b) => {
                let aEl = a.querySelector(`span.${that.dataRowColClassName}[data-name="${hdrColEl.dataset.name}"]`);
                let bEl = b.querySelector(`span.${that.dataRowColClassName}[data-name="${hdrColEl.dataset.name}"]`);
                let aVal = (aEl instanceof Element)?aEl.textContent:null;
                let bVal = (bEl instanceof Element)?bEl.textContent:null;

                // handle custom sort function
                if ((colObj instanceof Object) && (colObj.sortFunction instanceof Function)){
                    return((hdrColEl.dataset.sort == 'ascending')?colObj.sortFunction(aVal,bVal):colObj.sortFunction(bVal,aVal));

                    // handle numeric sort
                }else if (/^\d+$/.test(aVal) && /^\d+$/.test(bVal)){
                    return((hdrColEl.dataset.sort == 'ascending')?(aVal-bVal):(bVal-aVal));

                    // handle string sort
                }else{
                    return((hdrColEl.dataset.sort == 'ascending')?aVal.localeCompare(bVal):bVal.localeCompare(aVal));
                }
            }).forEach((el) => {
                that._DOMElements.tableListContainer.appendChild(el);
            })
        }
    }
}




/*
    modifyCellValue(rowElement, cellElement, value)
    set the given value on the specified cellElement within the specified rowElement
    await the modifyRowCallback if we have one, then call renderCells and be out
*/
modifyCellValue(rowElement, cellElement, value){
    let that = this;
    return(new Promise((toot, boot) => {

        new Promise((_t, _b) => {
            let guh = {};
            guh[cellElement.dataset.name] = value;
            if (that.modifyRowCallback instanceof Function){
               that.modifyRowCallback(rowElement, guh).then((d) => { _t(d); }).catch((error) => { _b(error); });
            }else{
               _t(guh);
           }
        }).then((cData) => {
            let dta = Object.assign({}, JSON.parse(rowElement.dataset.rowdata), cData);
            rowElement.dataset.rowdata = JSON.stringify(dta);
            try {
                that.renderCells(rowElement);
                toot(true);
            }catch(e){
                if (that.debug){ console.log(`${that._className} v${that._version} | modifyCellValue() | renderCells() threw unexpectedly: ${error}`); }
                boot(error);
            }
        }).catch((error) => {
            if (that.debug){ console.log(`${that._className} v${that._version} | modifyCellValue() | modifyRowCallback() threw unexpectedly: ${error}`); }
            boot(error);
        });
    }));
}




/*
    getRowElement(rowData, rownum, renderCellsBool)
    get the DOM element for a table row with the given rowData
    set dataset.rownum to the given rownum (if null: 0) -- this is the default sort order
    if renderCellsBool is true, call renderCells on it (maybe you don't want to if you're not sure the cols exist yet)
*/
getRowElement(row, rownum, renderCellsBool){
    let that = this;
    if (row instanceof Object){
        let div = document.createElement('div');
        div.className = that.dataRowClassName;
        div.dataset.selected = "false";
        div.dataset.rownum = isNaN(parseInt(rownum))?0:parseInt(rownum);
        div.dataset.rowdata = JSON.stringify(row);
        that.applyRowCSS(div);
        div.addEventListener('click', (evt) => { that.handleRowSelect(div); });
        if (renderCellsBool === true){ that.renderCells(div); }
        return(div);
    }else{
        throw(`${that._className} v${that._version} | getRowElement() | invalid input`);
    }
}




/*
    addRow(rowData, renderCellsBool)
*/
addRow(row, renderCellsBool){
    let that = this;
    let newRow = this.getRowElement(row, (this.numRows + 1), (this.isNull(renderCellsBool) || (renderCellsBool === true)));
    this._DOMElements.tableListContainer.appendChild(newRow);
    if (that.rowSetupCallback instanceof Function){ that.rowSetupCallback(newRow, that); }
    this.updateFooterMessage();
}




/*
    removeRow(idx)
    delete the row at the specified index. This is 1-indexed (so first row is 1)
*/
removeRow(idx){
    let el = this._DOMElements.tableListContainer.querySelector(`.${this.dataRowClassName}:nth-child(${idx})`);
    if (el instanceof Element){
        el.remove();
        this.updateFooterMessage();
        return(el);
    }else{
        throw(`${this._className} v${this._version} | removeRow(${idx}) | invalid input`);
    }
}




/*
    getRow(idx)
    return this dataStructure for the given row:
    {data: {<fieldName>:<fieldValue>}, DOMElement: <RowElement>}
*/
getRow(idx){
    let el = this._DOMElements.tableListContainer.querySelector(`.${this.dataRowClassName}:nth-child(${idx})`);
    if (el instanceof Element){
        return({
            data: JSON.parse(el.dataset.rowdata),
            DOMElement: el
        });
    }else{;
        throw(`${this._className} v${this._version} | getRow(${idx}) | invalid input`);
    }
}




/*
    modifyRow(idx, data)
*/
modifyRow(idx, data){
    let that = this;
    return(new Promise((toot, boot) =>{
        let row = null;
        try {
            row = that.getRow(idx);
        }catch(e){
            if (that.debug){ console.log(`${that._className} v${that._version} | mofifyRow(${idx}, ${JSON.stringify(data)}) | getRow() threw unexpectedly: ${error}`); }
            boot(error);
        }
        if (that.isNotNull(row)){
            new Promise((_t,_b) =>{
                if (that.modifyRowCallback instanceof Function){
                    that.modifyRowCallback(row.DOMElement, data).then((cData) => { _t(cData); }).catch((error) => { _b(error); });
                }else{
                    _t(data);
                }
            }).then((cData) => {
                row.DOMElement.dataset.rowdata = JSON.stringify(Object.assign({}, JSON.parse(row.DOMElement.dataset.rowdata), cData));
                that.renderCells(row.DOMElement);
                toot(row);
            }).catch((error) => {
                if (that.debug){ console.log(`${that._className} v${that._version} | mofifyRow(${idx}, ${JSON.stringify(data)}) | modifyRowCallback() threw unexpectedly: ${error}`); }
                boot(error);
            });
        }
    }));
}




/*
    updateRow(rowElement, data, enableCallbackBool)
    this is like modifyRow, except we take the rowElement as an arg directly
    we update the data then call renderCells. If enableCallbackBool
    is set true await the modifyRowCallnack.
    on success resolves to the updated row DOM element
*/
updateRow(rowElement, data, enableCallbackBool){
    let that = this;

    return(new Promise((toot, boot) =>{
        // await the calback if we're supposed to
        new Promise((_t,_b) => {
            if ((enableCallbackBool === true) && (that.modifyRowCallback instanceof Function)){
                that.modifyRowCallback(rowElement, data).then((cData) => { _t(cData); }).catch((error) => { _b(error); });
            }else{
                _t(data);
            }
        }).then((cData) =>{
            // update the row and be out
            rowElement.dataset.rowdata = JSON.stringify(Object.assign({}, JSON.parse(rowElement.dataset.rowdata), cData));
            that.renderCells(rowElement);
            toot(rowElement);
        }).catch((error) => {
            if (that.debug){ console.log(`${that._className} v${that._version} | updateRow(${JSON.stringify(data)}) | modifyRowCallback() threw unexpectedly: ${error}`); }
            boot(error);
        })
    }));
}




/*
    data attribute
    get and set the entire table content including the header as a massive
    2D array-of-arrays. Basically take a parsed spreadsheet as input ya dig?
    NOTE: this sets/gets ONLY visible data since this format has no means of
    representing non-visible row values without a corresponding header columns
*/
get data(){
    // literally just returning a grid of what's visible in the DOM. noice!
    let that = this;
    let out = [ Array.from(that._DOMElements.headerRow.querySelectorAll(`span.${that.headerColClassName}`)).map((el)=>{return(el.textContent)}) ];
    return(out.concat(Array.from(that._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`)).map((el) => {return(
        Array.from(el.querySelectorAll(`span.${that.dataRowColClassName}`)).map((span) =>{ return(span.textContent); })
    )})));
}
set data(v){
    let that = this;
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Array)}).length)
    ){
        let columns = [];
        let rows = [];
        v.forEach((vRow, idx) => {
            // get cols from the header
            if (idx == 0){
                columns = vRow.map((colName, i) => {return({
                    name: colName,
                    order: i
                })});

            // the rest are data rows
            }else{
                let tmp = {};
                vRow.forEach((vCol, vIdx) => { if (vIdx < columns.length){ tmp[columns[vIdx].name] = vCol; } });
                rows.push(tmp);
            }
        });

        // reset table
        that.reset();
        that.columns = columns;
        that.rows = rows;

    }else{
        // bad data format
        throw(`${this._className} v${this._version} | data attribute setter | invalid input data format`)
    }
}




/*
    handleRowSelect(listRowElement, selectBool, recurseBypassBool)
    if selectBool is specified, we will explicitly set the given select state
    if the existing select state is already present will take no action.
    if not specified, will simply toggle whatever value is present on the listRowElement
*/
handleRowSelect(listRowEl, selectBool, recurseBypassBool){
    let that = this;
    let newSelectState = that.isNotNull(selectBool)?(selectBool === true):(listRowEl instanceof Element)?(! (listRowEl.dataset.selected == "true")):false;
    return(new Promise((toot, boot) =>{
        if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | called`); }
        if (listRowEl.dataset.locked == "true"){
            if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | row locked, abort | exit`); }
            toot(false);
        }else if (newSelectState == (listRowEl.dataset.selected == "true")){
            if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | no select state change | exit`); }
            toot(false);
        }else{
            if (['single', 'multiple'].indexOf(that.select_mode) >= 0){
                new Promise((_t,_b) => {
                    if ((that.select_mode == 'single') && (! (recurseBypassBool == true))){
                        // enforce single select (await all other selected deselect)
                        Promise.all(Array.from(that._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}[data-selected="true"]:not([data-rownum="${listRowEl.dataset.rownum}"])`)).map((el) => {
                            return(that.handleRowSelect(el, false, true))
                        })).then(() => {
                            _t(true);
                        }).catch((error) => {
                            if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | deselect previously selected row for single mode select threw unexpectedly: ${error}`); }
                            _b(error);
                        });
                    }else{
                        _t(false);
                    }
                }).then(() => {
                    // handle calling the callback for this one, etc
                    if (that.rowSelectCallback instanceof Function){
                        that.rowSelectCallback((! (listRowEl.dataset.selected == "true")), listRowEl, that).then(() => {
                            listRowEl.dataset.selected = newSelectState;
                            that.updateFooterMessage();
                            toot(true);
                        }).catch((error) => {
                            if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | rowSelectCallback() threw unexpectedly: ${error}`); }
                            boot(error);
                        });
                    }else{
                        listRowEl.dataset.selected = newSelectState;
                        that.updateFooterMessage();
                        toot(true);
                    }
                }).catch((error) => {
                    // deselect for select_mode: single aborted
                    if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | failed to deselect at least one previously selected row for select_mode:singl |  rowSelectCallback() threw unexpectedly: ${error}`); }
                    boot(error);
                })
            }else{
                that.updateFooterMessage();
                toot(false);
            }
        }
    }));
}
/*
    getSelected()
    return an array of all selected rows. We return the output of getRow() so
    [{data: {<fieldName>:<fieldValue>}, DOMElement: <RowElement>}, ...]
*/
getSelected(){
    return (Array.from(this._DOMElements.tableListContainer.querySelectorAll(`.${this.dataRowClassName}[data-selected="true"]`)).map((el) => {
        return(
            {
                data: JSON.parse(el.dataset.rowdata),
                DOMElement: el
            }
        )
    }));
}




/*
    deselectAll(forceBool)
    simply deselect all of the selected rows
    if forceBool is set true, just reset the rows and don't even bother trying the callback
    otherwise await the callbacks and let 'em abort if they need to
*/
deselectAll(forceBool){
    let that = this;
    return(Promise.all(Array.from(that._DOMElements.tableListContainer.querySelectorAll(`.${that.dataRowClassName}[data-selected="true"]`)).map((el) => {
        return(new Promise((toot, boot) => {
            if (forceBool === true){
                el.dataset.selected = false;
                toot(true);
            }else{
                that.handleRowSelect(el, false, true).then(()=>{toot(true)}).catch((error) => {
                    if (that.debug){ console.log(`${that._className} v${that._version} | deselectAll(${forceBool === true}) | rowSelectCallback() aborted deselect (try forceBool): ${error}`)}
                    boot(error);
                })
            }
        }));
    })));
}




/*
    selectAll(forceBool)
    simply select all of the selected rows
    if forceBool is set true, just reset the rows and don't even bother trying the callback
    otherwise await the callbacks and let 'em abort if they need to
    totes obvs: this does not a thing if select_mode != 'multiple'
*/
selectAll(forceBool){
    let that = this;
    return(Promise.all(Array.from(that._DOMElements.tableListContainer.querySelectorAll(`.${that.dataRowClassName}[data-selected="false"]`)).map((el) => {
        return(new Promise((toot, boot) => {
            if (! that.select_mode == "multiple"){
                toot(true);
            }else if (forceBool === true){
                el.dataset.selected = true;
                toot(true);
            }else{
                that.handleRowSelect(el, true, true).then(()=>{toot(true)}).catch((error) => {
                    if (that.debug){ console.log(`${that._className} v${that._version} | selectAll(${forceBool === true}) | rowSelectCallback() aborted deselect (try forceBool): ${error}`)}
                    boot(error);
                })
            }
        }));
    })));
}




/*
    clear()
    remove all data rows from the table
*/
clear(){
    this._DOMElements.tableListContainer.innerHTML = '';
}




/*
    reset()
    remove all data rows and all columns from the table
*/
reset(){
    this.clear();
    this.columns = [];
    this._DOMElements.headerRow.innerHTML = '';
}




/*
    handleSelectAll()
    not much but could be a lot of 'em, so batches of syncRowsBatchLimit
    on animationFrames, yo!
*/
handleSelectAll(evt){
    let that = this;
    return(new Promise((toot, boot) => {
        that._DOMElements.btnSelectAll.disabled = true;
        let chunks = [];
        let queue = Array.from(that._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}[data-selected="false"]`));
        while (queue.length > 0){ chunks.push(queue.splice(0, that.syncRowsBatchLimit)); }

        function recursor(idx){
            if (idx == chunks.length){
                toot(true);
            }else{
                Promise.all(chunks[idx].map((el) => {return(that.handleRowSelect(el, true, false))})).then(() => {
                    requestAnimationFrame(() => { recursor(idx + 1)})
                })
            }
        }
        recursor(0);
    }));
}




/*
    handleSelectNone()
    bizarro-world version of handleSelectAll() :p
*/
handleSelectNone(evt){
    let that = this;
    return(new Promise((toot, boot) => {
        that._DOMElements.btnSelectNone.disabled = true;
        let chunks = [];
        let queue = Array.from(that._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}[data-selected="true"]`));
        while (queue.length > 0){ chunks.push(queue.splice(0, that.syncRowsBatchLimit)); }

        function recursor(idx){
            if (idx == chunks.length){
                toot(true);
            }else{
                Promise.all(chunks[idx].map((el) => {return(that.handleRowSelect(el, false, false))})).then(() => {
                    requestAnimationFrame(() => { recursor(idx + 1)})
                })
            }
        }
        recursor(0);
    }));
}




/*
    moveRow(rowElement, toIndex)
    move the given row to the given index
    the previous occupant of toIndex will get an Element.before(),
    meaning everything else gets shifted down -- if toIndex is < rowElement.currentPosition
    and an Element.after() if toIndex is > rowElement.currentPosition

    this *does not* affect default sort order so you might not
    wanna use this in conjuction with allowColumnSort:true
    as the user could easily blow away whatever moves you've made here.
    <bigvoice>you have been warned!</bigvoice>
*/
moveRow(rowElement, toIndex){
    let el = this._DOMElements.tableListContainer.querySelector(`.${this.dataRowClassName}:nth-child(${toIndex})`);
    let rowElementIndex = (Array.from(this._DOMElements.tableListContainer.children).indexOf(rowElement) + 1);
    if (el instanceof Element){
        if (rowElementIndex > toIndex){ el.before(rowElement); }else{ el.after(rowElement); }
    }
}




/*
    nudgeSelection(dir, distance)
    move the group of seleected rows 'up' or 'down' (dir) the
    <distance> number of steps. If you try to nudge it out of bounds
    nothing happens. throwin' is for shade, gurl.
*/
nudgeSelection(dir, distance){
    let that = this;
    if (
        (['up', 'down'].indexOf(dir) >= 0) &&
        (! isNaN(parseInt(distance))) &&
        (parseInt(distance) >= 1) &&
        (parseInt(distance) <= this.numRows)
    ){

        let rows = that.getSelected();

        // bounds check
        let a = Array.from(this._DOMElements.tableListContainer.children);
        let min = (a.indexOf(rows[0].DOMElement) + 1);
        let max = (a.indexOf(rows[(rows.length -1)].DOMElement) + 1);
        if ((dir == 'up') && ((min - distance) > 0)){

            // jeffersons time
            rows.forEach((row) => {
                that.moveRow(row.DOMElement, ((a.indexOf(row.DOMElement)+1) - distance));
            });

        }else if ((dir == 'down') && ((max + distance) <= that.numRows)){
            // kick it root down
            rows.forEach((row) => {
                that.moveRow(row.DOMElement, ((a.indexOf(row.DOMElement)+1) + distance));
            });
        }
        // yeah I know its messy but it gets the jerb dun
        that.getFooterMessage();
    }
}




/*
    getCell(rowElement, colName)
*/
getCell(rowElement, colName){
    let col;
    if ((rowElement instanceof Element) && this.isNotNull(colName)){
        col = rowElement.querySelector(`span.${this.dataRowColClassName}[data-name="${colName}"]`);
    }
    if (col instanceof Element){
        return(col);
    }else{
        throw(`${this._className} v${this._version} | getCell() | invalid input`);
    }
}




/*
    lockCell(cellElement, lockBool, lockMessage)
*/
lockCell(cellElement, lockBool, lockMessage){
    if (cellElement instanceof Element){
        cellElement.dataset.locked = (lockBool === true);

        if ((cellElement.dataset.locked == "true") && this.isNotNull(lockMessage)){
            cellElement.dataset.lockmessage = lockMessage;
        }

        if (! (cellElement.dataset.locked == "true")){
            cellElement.dataset.lockmessage = '';
        }
    }else{
        throw(`${this._className} v${this._version} | lockCell() | invalid input`);
    }
}




}
export { wcTable };
