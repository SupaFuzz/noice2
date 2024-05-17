/*
    wcTable.js
    5/17/24 Amy Hicox <amy@hicox.com>

    this is a reimplementation of noiceCoreUITable as a webComponent
    starting over from scratch. second try. a direct port absolutely did not work :-/

*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

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

    // deferred attributes
    columns: { observed: false, accessor: false, type: 'array', value: [], deferred: true }

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

        // stubs for callbacks
        rowSelectCallback: null,
        renderRowsProgressCallback: null,
        getFooterMessageCallback: null,
        getPrefEditorCallback: null,
        modifyRowCallback: null,

        // stubs for internal getter/setters
        _customButtons: [],
        _columns: [],
        _rows: []

    });
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
        <div data-_name="uiContainer" style="">
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

    //this.pullElementAttributes(div);

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

    /* visibility toggles */
    :host([show_footer="false"]) div[data-_name="footer"],
    :host([show_btn_prefs="false"]) div[data-_name="footerButtonContainer"] button.btnPrefs,
    :host([show_btn_select_all="false"]) div[data-_name="footerButtonContainer"] button.btnSelectAll,
    :host([show_btn_select_none="false"]) div[data-_name="footerButtonContainer"] button.btnSelectNone,
    :host([show_btn_export="false"]) div[data-_name="footerButtonContainer"] button.btnExport,
    :host([show_footer_message="false"]) div[data-_name="footerMessage"],
    :host([show_row_nudge_buttons="false"]) div[data-_name="footerButtonContainer"] button.btnNudgeUp,
    :host([show_row_nudge_buttons="false"]) div[data-_name="footerButtonContainer"] button.btnNudgeDown
    {
        display: none;
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
        */

        toot(true);
    }));
}




}
export { wcTable };
