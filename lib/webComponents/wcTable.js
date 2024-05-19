/*
    wcTable.js
    5/17/24 Amy Hicox <amy@hicox.com>

    this is a reimplementation of noiceCoreUITable as a webComponent
    starting over from scratch. second try. a direct port absolutely did not work :-/

*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { getGUID, epochTimestamp } from '../noiceCore.js';

import { wcPieChart } from './wcPieChart.js';
wcPieChart.registerElement('wc-pie-chart');


class wcTable extends noiceAutonomousCustomElement {




static classID = wcTable;
static classAttributeDefaults = {

    // simple elementAttributes
    label: { observed: true, accessor: true, type: 'elementAttribute', value: '' },
    footer_message: { observed: true, accessor: true, type: 'elementAttribute', value: '' },

    // managed elementAttributes
    header_row: { observed: true, accessor: true, type: 'elementAttribute', value: '' },

    // managed attributes

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
    allow_column_sort: { observed: true, accessor: true, type: 'bool', value: false },
    sync_rows_batch_limit: { observed: true, accessor: true, type: 'int', value: 250 },
    allow_cell_edit:  { observed: true, accessor: true, type: 'bool', value: false },
    select_mode: { observed: true, accessor: true, type: 'enum', values:['none','single','multiple'], value: 'none' },


    // deferred attributes
    columns: { observed: false, accessor: false, type: 'array', value: [], deferred: true },
    rows: { observed: false, accessor: false, type: 'array', value: [], deferred: true },
    custom_buttons: { observed: false, accessor: false, type: 'array', value: [], deferred: true }

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

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        /*
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };

    // merge object defaults
    this.mergeClassDefaults({

        // internal classNames
        headerColClassName: 'hdrCol',
        headerRowClassName: 'hdrRow',
        dataRowClassName: 'listRow',
        dataRowColClassName: 'listCol',
        defaultCellEditorInputClass: 'cellEditor',
        defaultPrefUIClass: 'tablePrefEditor',
        defaultPrefUIEditorClass: 'defaultPrefUIEditor',
        userPromptClass: 'userPrompt',
        exportUIClass: 'exportUI',

        // stubs for callbacks
        rowSelectCallback: null,
        renderRowsProgressCallback: null,
        getFooterMessageCallback: null,
        getPrefEditorCallback: null,
        modifyRowCallback: null,
        rowSetupCallback: null,

        // stubs for internal getter/setters
        _customButtons: [],
        _columns: [],
        _rows: [],
        _guidCache: {}

    });

    this.getGUID = getGUID;
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;

    /*
        insert shenanigans here
        also set this._elements references if needed
        also setup default event listeners if needed
    */
    div.innerHTML = `
        <div class="label" data-_name="label"></div>
        <div data-_name="uiContainer">
            <div class="tableContainer" data-_name="tableContainer">
                <div class="tableHeader ${this.headerRowClassName}" data-_name="tableHeader">
                    <div data-_name="header_row"></div>
                </div>
                <div class="tableListContainer" data-_name="tableListContainer"></div>
            </div>
        </div>
        <div class="footer" data-_name="footer">
            <div class="buttonContainer" data-_name="footerButtonContainer">
                <button class="btnPrefs txtBtn" data-_name="btnPrefs">columns</button>
                <button class="btnSelectAll txtBtn" data-_name="btnSelectAll" disabled>select all</button>
                <button class="btnSelectNone txtBtn" data-_name="btnSelectNone" disabled>select none</button>
                <button class="btnExport txtBtn" data-_name="btnExport" disabled>export</button>
                <button class="btnNudgeUp txtBtn" data-_name="btnNudgeUp" disabled>&#9650;</button>
                <button class="btnNudgeDown txtBtn" data-_name="btnNudgeDown" disabled>&#9660;</button>
            </div>
            <div class="footer_message" data-_name="footer_message"></div>
        </div>`;
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

    // listeners for the buttons
    let that = this;
    that._elements.btnPrefs.addEventListener('click', (evt) => { that.openPrefEditor(evt); that._elements.btnPrefs.blur(); });
    that._elements.btnSelectAll.addEventListener('click', (evt) => { that.handleSelectAll(evt); that._elements.btnSelectAll.blur(); });
    that._elements.btnSelectNone.addEventListener('click', (evt) => { that.handleSelectNone(evt); that._elements.btnSelectNone.blur(); });
    that._elements.btnExport.addEventListener('click', (evt) => { that.openExportUI(evt); that._elements.btnExport.blur(); });
    that._elements.btnNudgeUp.addEventListener('click', (evt) => { that.nudgeSelection('up', 1); that._elements.btnNudgeUp.blur(); });
    that._elements.btnNudgeDown.addEventListener('click', (evt) => { that.nudgeSelection('down', 1); that._elements.btnNudgeDown.blur(); });

    // pre-spawn the table preferences editor frame thingy
    let div = document.createElement('div');
    div.className = that.defaultPrefUIClass;

    div.innerHTML = `<div class="uiContainer" style="width:100%; height:100%;display:grid;align-content:center;justify-content:center;"><div>`;
    that.prefEditorFrameThingy = { DOMElement: div, _elements: { uiContainer: div.querySelector('div.uiContainer') }};
    that.prefEditorFrameThingy.DOMElement.style.overflow = "auto";

}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
    }

    /* visibility toggles */
    :host([show_footer="false"]) div[data-_name="footer"],
    :host([show_btn_prefs="false"]) div[data-_name="footerButtonContainer"] button.btnPrefs,
    :host([show_btn_select_all="false"]) div[data-_name="footerButtonContainer"] button.btnSelectAll,
    :host([show_btn_select_none="false"]) div[data-_name="footerButtonContainer"] button.btnSelectNone,
    :host([show_btn_export="false"]) div[data-_name="footerButtonContainer"] button.btnExport,
    :host([show_footer_message="false"]) div[data-_name="footer_message"],
    :host([show_row_nudge_buttons="false"]) div[data-_name="footerButtonContainer"] button.btnNudgeUp,
    :host([show_row_nudge_buttons="false"]) div[data-_name="footerButtonContainer"] button.btnNudgeDown
    {
        display: none;
    }

    /* port me */
    div[data-_name="uiContainer"] {
        position: relative;
        width: 100%;
    }
    div[data-_name="footer"] {
        grid-template-columns: auto auto;
        align-items: center;
    }
    div[data-_name="footer"] div.buttonContainer {
        text-align: left;
    }
    div[data-_name="footer_message"] {
        overflow: auto;
    }
    div[data-_name="tableListContainer"] {
        display: grid;
        scrollbar-width: thin;
        scrollbar-gutter: stable;
        overflow-y: auto;
        min-width: fit-content;
        align-content: baseline;
    }
    div[data-_name="header_row"] {
        scrollbar-width: thin;
        scrollbar-gutter: stable;
    }
    div[data-_name="tableContainer"] {
        scrollbar-width: thin;
    }

    :host([show_footer="false"]) div[data-_name="footer"]{
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
    .footer_message {
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
    .tablePrefEditor {
        position: absolute;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        left: 0px;
        top: 0px;
        z-index: 2;
        font-size: .8em;
    }
    .tablePrefEditor, .userPrompt, .exportUI {
       background-color: rgba(24, 35, 38, .66);
       border-radius: .5em;
    }
    .defaultPrefUIEditor fieldset {
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
       background-color: rgba(240, 240, 240, .8);
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
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcTable.classAttributeDefaults);
}




/*
    --------------------------------------------------------------------------------
    CUSTOM STUFF
    above this line is class-standard overrides
    --------------------------------------------------------------------------------
*/




/*
    columns attribute
*/
get columns(){ return(this._columns); }
set columns(v){
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Object) && a.hasOwnProperty('name') && this.isNotNull(a.name)}, this).length)
    ){

        if (this.initialized){
            // this is *the* set of columns meaning we blow away whatever was there
            this._columns = [];
            this.header_row = '';

            // aight! holonnaurbutts ... note addCol will push this._columns for us
            v.forEach((col) => {
                try {
                    this.addColumn(col, false);
                }catch(e){
                    throw(`${this._className} v${this._version} | columns attribute setter | addColumn() threw unexpectedly for ${col.name} | ${e}`);
                }
            }, this);

            // setup the css
            this.applyRowCSS(this._elements.header_row);

            // the cols are added, sync the rows
            this.syncRows();
        }else{
            this._columns = v;
        }

    }else{
        throw(`${this._className} v${this._version} | columns attribute setter | invalid input format`);
    }
}




/*
    addColumn(col, propagateBool)
    add the column, syncRows if propagateBool is true
*/
addColumn(col, propagateBool){
    if (
        (col instanceof Object) &&
        col.hasOwnProperty('name') &&
        this.isNotNull(col.name) &&
        (this.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == col.name))}).length == 0)
    ){
        // set default column order
        if (!(col.hasOwnProperty('order') && (! isNaN(parseInt(col.order))))){ col.order = this._columns.length + 1; }

        let span = this.getHeaderCell(col);
        col.visible = col.hasOwnProperty('visible')?(col.visible === true):true;
        this._columns.push(col);
        if (col.visible === true){
            this._elements.header_row.appendChild(span);
            this.applyRowCSS(this._elements.header_row);
            if (propagateBool === true){ this.syncRows(); }
        }else{
            col._el = span;
        }

    }else{
        throw(`${this._className} v${this._version} | addColumn() | invalid input`);
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
    applyRowCSS(rowElement)
    calculate grid-template-columns and apply it to the specified row
    this is the "use CSS to make it look like an old school table" part
*/
applyRowCSS(el){
    if (el instanceof Element){
        el.style.display = 'grid';
        el.style.cursor = 'default';
        el.style.userSelect = 'none';
        el.style.width = '100%';
        el.style.height = 'max-content';
        el.style.gridTemplateColumns = this.columns.filter((a)=>{return(a.visible === true)}).sort((a,b) => {return(a.order - b.order)}).map((col) => {
            let width = ((col instanceof Object) && col.hasOwnProperty('width') && this.isNotNull(col.width))?col.width:1;
            return(
                `${width}${/^\d+$/.test(width)?'fr':''}`
            )
        }, this).join(" ");
    }
}




/*
    handleColumnSort(headerColumnElement)
*/
handleColumnSort(hdrColEl){
    let that = this;
    if (that.allow_column_sort === true){
        if (that.debug){ console.log(`${that._className} v${that._version} | handleColumnSort(${hdrColEl.dataset.name}) | called`); }

        // it's a three way toggle: none | ascending | descending
        let modes = ['none','ascending','descending'];
        hdrColEl.dataset.sort = modes[
            (((modes.indexOf(hdrColEl.dataset.sort) + 1) > modes.length -1) || (modes.indexOf(hdrColEl.dataset.sort) < 0))?0:(modes.indexOf(hdrColEl.dataset.sort) + 1)
        ];
        let colObj = that.columns.filter((a)=>{return(a.name == hdrColEl.dataset.name)})[0];

        // ok when unsetting the sort we don't really do anything until all of the cols are sorted none, then we restore the original sort order
        if (hdrColEl.dataset.sort == "none"){
            if (Array.from(that._elements.tableHeader.querySelectorAll(`span.${that.headerColClassName}:not([data-sort="none"])`)).length == 0){
                Array.from(that._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`)).sort((a,b) => {
                    return(parseInt(a.dataset.rownum) - parseInt(b.dataset.rownum))
                }).forEach((el) => {
                    that._elements.tableListContainer.appendChild(el);
                })
            }
        }else{
            Array.from(that._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`)).sort((a,b) => {
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
                that._elements.tableListContainer.appendChild(el);
            })
        }
    }
}




/*
    syncRows(progressCallback)
    update every single row by calling renderCells on it
    (which in turn calls applyRowCSS)

    this executes on animationFrames, we batch rows into
    gropus of this.sync_rows_batch_limit

    as such is is async. We will call progressCallback(partial, complete, selfReference)
    if specified.
*/
syncRows(progressCallback){
    let that = this;
    return(new Promise((toot, boot) => {
        let chunks = [];
        let queue = Array.from(this._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`));
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
    custom_buttons
    [{name: <str>, callback: function(tableRef, btnRef)}, ...]

    TO-DO: 5/17/24 @ 2256
    I just realized this contains callback references stored in the DOM
    which is just generally not cool. We need to set up an event listener thing
    like with the other web components
*/
get custom_buttons(){ return(this._customButtons); }
set custom_buttons(v){
    let that = this;
    if (v instanceof Array){

        if (that.initialized){
            // remove any existing custom buttons
            that._elements.footerButtonContainer.querySelectorAll('button.customButton').forEach((el) => { el.remove(); });

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
                that._elements.footerButtonContainer.appendChild(el);
            });
        }
        that._customButtons = v;
    }
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
    that._elements.btnPrefs.dataset.open = (!(that._elements.btnPrefs.dataset.open == 'true'));
    if (that._elements.btnPrefs.dataset.open == 'true'){
        that.openPanel(that.getPrefEditor());
        that._elements.btnExport.disabled = true;
    }else{
        that.closePanel();
        that._elements.btnExport.disabled = false;
    }
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
        <fieldset style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; text-align: left;">
            <legend>select columns</legend>
            ${
                that.columns.sort((a,b) => {return(a.order - b.order)}).map((a) =>{
                    let guid = that.getGUID(that._guidCache);
                    return(`
                        <div class="defaultColSelectorOption" data-id="${guid}">
                            <input type="checkbox" data-colname="${a.name}" id="${guid}" ${(a.visible === true)?'checked':''} />
                            <label for="${guid}">${a.name}</label>
                        </div>
                    `);
                }).join("")
            }
        </fieldset>
        <div class="btnContainer" style="width: 100%; text-align: right;"><button class="btnClose">close</button></div>
    `;
    div.querySelectorAll('input').forEach((el) => {
        el.addEventListener("change", (evt) => {
            that.toggleColumnVisibility(el.dataset.colname, el.checked);
        });
    });
    div.querySelector('button.btnClose').addEventListener("click", (evt) => {
        that._elements.btnPrefs.click();
    });
    return(div);
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
            let el = that._elements.header_row.querySelector(`span.${that.headerColClassName}[data-name="${colName}"]`);
            if (el instanceof Element){
                colObject._el = el;
                el.remove();
            }

        }else{

            // with an equally cheeky disposition, add it back
            let ord = that.columns.sort((a,b)=>{return(a.order - b.order)}).map(a=>{return(a.name)});
            that._elements.header_row.appendChild((colObject._el instanceof Element)?colObject._el:that.getHeaderCell(colObject));
            Array.from(that._elements.header_row.querySelectorAll(`span.${that.headerColClassName}`)).sort((a,b) => {return(
                ord.indexOf(a.dataset.name) - ord.indexOf(b.dataset.name)
            )}).forEach((el) => {that._elements.header_row.appendChild(el); });
        }

        // remove it from the internal column list
        that.columns.filter((a)=>{return((a instanceof Object) && (a.hasOwnProperty('name')) && (a.name == colName))})[0].visible = (visibilityBool === true);

        // sync the rows if we have the flag
        that.applyRowCSS(that._elements.header_row);
        that.syncRows();

    }else{
        throw(`${that._className} v${that._version} | toggleColumnVisibility(${colName}, ${visibilityBool == true}) | invalid input`);
    }
}




/*
    handleSelectAll()
    not much but could be a lot of 'em, so batches of sync_rows_batch_limit
    on animationFrames, yo!
*/
handleSelectAll(evt){
    let that = this;
    return(new Promise((toot, boot) => {
        that._elements.btnSelectAll.disabled = true;
        let chunks = [];
        let queue = Array.from(that._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}[data-selected="false"]`));
        while (queue.length > 0){ chunks.push(queue.splice(0, that.sync_rows_batch_limit)); }

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
                        Promise.all(Array.from(that._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}[data-selected="true"]:not([data-rownum="${listRowEl.dataset.rownum}"])`)).map((el) => {
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
    updateFooterMessage()
*/
updateFooterMessage(){
    this._elements.footer_message.innerHTML = '';
    this._elements.footer_message.appendChild(this.getFooterMessage());
}




/*
    getFooterMessage()
*/
getFooterMessage(){
    let that = this;

    /*
        does this belong here? no
        does every other part of the code that could affect a row select end up calling this: yes
        they say you can fix anything with duct tape and determination, y'know?
    */
    if(that.show_btn_select_none){that._elements.btnSelectNone.disabled = (this.numSelectedRows < 1);}
    if(that.show_btn_select_all){that._elements.btnSelectAll.disabled = (this.numRows == this.numSelectedRows);}
    if(that.show_btn_export){that._elements.btnExport.disabled = (this.numRows == 0);}
    if (that.show_row_nudge_buttons){
        if (this.numSelectedRows > 0){
            let selected = that.getSelected();
            let min = (Array.from(this._elements.tableListContainer.children).indexOf(selected[0].DOMElement) + 1);
            let max = (Array.from(this._elements.tableListContainer.children).indexOf(selected[(selected.length -1)].DOMElement) + 1);

            // disable up nudge if the minimum selected row is at top
            that._elements.btnNudgeUp.disabled = (min == 1);

            // disable nudge down if the max selected row is at bottom
            that._elements.btnNudgeDown.disabled = (max == that.numRows);

        }else{
            that._elements.btnNudgeUp.disabled = true;
            that._elements.btnNudgeDown.disabled = true;
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
    getSelected()
    return an array of all selected rows. We return the output of getRow() so
    [{data: {<fieldName>:<fieldValue>}, DOMElement: <RowElement>}, ...]
*/
getSelected(){
    return (Array.from(this._elements.tableListContainer.querySelectorAll(`.${this.dataRowClassName}[data-selected="true"]`)).map((el) => {
        return(
            {
                data: JSON.parse(el.dataset.rowdata),
                DOMElement: el
            }
        )
    }));
}




/*
    numRows attribute
    return the number of data rows in the table
*/
get numRows(){
    return(this._elements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}`).length);
}




/*
    numSelectedRows attribute
    return the number of data rows in the table
*/
get numSelectedRows(){
    return(this._elements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}[data-selected="true"]`).length);
}




/*
    handleSelectNone()
    bizarro-world version of handleSelectAll() :p
*/
handleSelectNone(evt){
    let that = this;
    return(new Promise((toot, boot) => {
        that._elements.btnSelectNone.disabled = true;
        let chunks = [];
        let queue = Array.from(that._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}[data-selected="true"]`));
        while (queue.length > 0){ chunks.push(queue.splice(0, that.sync_rows_batch_limit)); }

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
        let a = Array.from(this._elements.tableListContainer.children);
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
        that.updateFooterMessage();
    }
}




/*
    removeRow(idx)
    delete the row at the specified index. This is 1-indexed (so first row is 1)
*/
removeRow(idx){
    let el = this._elements.tableListContainer.querySelector(`.${this.dataRowClassName}:nth-child(${idx})`);
    if (el instanceof Element){
        el.remove();
        this.updateFooterMessage();
        return(el);
    }else{
        throw(`${this._className} v${this._version} | removeRow(${idx}) | invalid input`);
    }
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
    let el = this._elements.tableListContainer.querySelector(`.${this.dataRowClassName}:nth-child(${toIndex})`);
    let rowElementIndex = (Array.from(this._elements.tableListContainer.children).indexOf(rowElement) + 1);
    if (el instanceof Element){
        if (rowElementIndex > toIndex){ el.before(rowElement); }else{ el.after(rowElement); }
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

    return(
        (this._rows instanceof Array)?this._rows:Array.from(this._elements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}`)).map((el) => {
            return(JSON.parse(el.dataset.rowdata))
        })
    );
}
set rows(v){
    let that = this;
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Object)}).length)
    ){
        if (that.initialized){
            that.tableListContainer = '';
            let chunks = [];
            let complete = v.length;
            let doneCount = 0;
            while (v.length > 0){ chunks.push(v.splice(0, this.sync_rows_batch_limit)); }
            function recursor(idx){
                if (idx == chunks.length){
                    delete(that._rows);
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
            this._rows = v;
        }
    }else{
        throw(`${that._className} v${that._version} | rows attribute setter | invalid input format`);
    }
}




/*
    addRow(rowData, renderCellsBool)
*/
addRow(row, renderCellsBool){
    let that = this;
    let newRow = this.getRowElement(row, (this.numRows + 1), (this.isNull(renderCellsBool) || (renderCellsBool === true)));
    this._elements.tableListContainer.appendChild(newRow);
    if (that.rowSetupCallback instanceof Function){ that.rowSetupCallback(newRow, that); }
    this.updateFooterMessage();
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
    openPanel(DOMTree)
*/
openPanel(DOMTree){
    let that = this;
    if (DOMTree instanceof Element){
        that._elements.uiContainer.appendChild(that.prefEditorFrameThingy.DOMElement);
        that.prefEditorFrameThingy._elements.uiContainer.innerHTML = '';
        that.prefEditorFrameThingy._elements.uiContainer.appendChild(DOMTree);
        requestAnimationFrame(() => {
            let d = that.prefEditorFrameThingy._elements.uiContainer.getBoundingClientRect();
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
    this.prefEditorFrameThingy.DOMElement.remove();
    this.DOMElement.style.minWidth = null;
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
                    that._elements.footerButtonContainer.querySelectorAll('button').forEach((el) => { el.disabled = false; });
                    toot(args.options[s]);
                });
                return(btn);
            }).forEach((el) => { div.querySelector("div.buttonContainer").appendChild(el); })
        }
        that._elements.footerButtonContainer.querySelectorAll('button').forEach((el) => { el.disabled = true; });
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
        let that = this;
        return(new Promise((toot, boot) => {
            that._elements.btnExport.disabled = true;

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
            let pie = new wcPieChart({
                show_chart: true,
                size: '4em',
                zIndex: 1
            });
            pie.addChart({name: 'loading', value: 0, chart_color: 'rgba(6, 133, 135, .66)'});
            gfxContainer.appendChild(pie);

            // btnClose hook
            btnClose.addEventListener('click', (evt) => {
                that.closePanel();
                that._elements.btnExport.disabled = false;
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
    }));
}




/*
    getCSVExport(exportSelectedOnlyBool, pieChart, explainerEl, linkEl)
    export the table (or the selected rows if exportSelectedOnlyBool is hot)
    do this in batches of sync_rows_batch_limit length aligned to animationFrames
    because there might be a bajillion rows to deal with

    explainerEl is a span, put progress messages here

    linkEl is the link onto which we should put the big CSV export we build here
*/
getCSVExport(exportSelectedOnlyBool, pieChart, explainerEl, linkEl){
    let that = this;
    return(new Promise((toot, boot) => {

        // get sync_rows_batch_limit sized chunks of rows
        let chunks = [];
        let queue = Array.from(this._elements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}${(exportSelectedOnlyBool === true)?'[data-selected="true"]':''}`));
        let complete = queue.length;
        while (queue.length > 0){ chunks.push(queue.splice(0, this.sync_rows_batch_limit)); }
        let csvQueue = [];

        // get the header :-)
        csvQueue.push(that.encodeCSVRow(Array.from(that._elements.header_row.querySelectorAll(`span.${that.headerColClassName}`)).map((el) =>{ return(el.textContent); })));

        // basically we're doing what get data() would do but spitting out an array of csv encoded strings
        pieChart.updateChart('loading', 0);
        explainerEl.textContent = 'exporting ...';
        function recursor(idx){
            if (idx == chunks.length){
                // zip it 'n ship it yo!
                linkEl.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csvQueue.join("\n"));
                linkEl.download = that.isNotNull(that.exportFileName)?that.exportFileName:`csv_export_${epochTimestamp(true)}.csv`;
                pieChart.updateChart('loading', 0);
                pieChart.badgeTxt = '✔️';
                explainerEl.textContent = `export ready`;
                toot(true);
            }else{
                // get literally whatever columns are on screen, then get a CSV row from it and push it on the stack
                chunks[idx].forEach((rowEl) =>{
                    csvQueue.push(that.encodeCSVRow(Array.from(rowEl.querySelectorAll(`span.${that.dataRowColClassName}`)).map((el) =>{ return(el.textContent); })))
                });
                explainerEl.textContent = `exporting (${csvQueue.length} of ${complete})`;
                pieChart.updateChart('loading', ((csvQueue.length/complete)*100));
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
    --------------------------------------------------------------------------------
    to-do section
    this is a holding pen of stub functions -- these are placeholders for functions
    with complicated dependencies that we're saving for

    --------------------------------------------------------------------------------
*/


/*
    handleCellEdit(rowElement, cellElement)
    if allowCellEdit: true, and editCellCallback is specified, call it and await output
    if resolved promise, send returned value to modifyRow() and let it call the modifyRowCallback() if specified
*/
handleCellEdit(rowElement, cellElement){
    let that = this;
    return(new Promise((toot, boot) => {

        /*
            LOH 5/17/24 @ 1653
            handleCellEdit has a LOT of prerequisites -- mostly relating to opening the
            embedded UI and stuff.

            I need to make sure the above renders a header at least.
            then come back on this.

            wcTable.bkp.js
            has the cellEditor getter/setter and an updated handleCellEdit that references
            it (which allows us not to have a managed attribute for allow_cell_edit that attaches
            the defaultCellEditCallback -- this just streamlines that so copy that in)

            aight. I'm off to get at least the above working
            first step:

                * check initialized on the above
                  don't try to write to the DOM before we have the DOM

                * ok and here's a thought -- for cols, rows, etc that set straight to the DOM
                  figure out a way to tag these for deferred setting like we do on elementAttributes
                  super easy.

                  like if we aren't initialized, we just stash the value
                  then we actually set it inside set initialized() after we have DOM elements.

                  this may actually be the key that lets us copy a lotta shit straight in
                  declare attributes with deferred setters that aren't necessarily originating from markup

              UPDATE @ 2244 -- I had coffee at the support group and I can't sleep
              the above is exactly what I did. The columns attribute is a deferred attribute which sets
              object data at instantiation and automatically resets it on initialization to update the DOM.

              so the columns setter works correctly now.

              for the reasons mentioned above, leaving this for the last pass as it involves the embedded
              dialog.

              curing my insomnia by porting other unrelated functions and their dependencies.

        */

        toot(true);
    }));
}




}
export { wcTable };
