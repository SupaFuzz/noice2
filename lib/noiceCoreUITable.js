/*
    noiceCoreUITable.js
    2/6/24 - Amy Hicox <amy@hicox.com>

    ## attributes

    * columns(array-of-objects>)
      gets or sets column definitions in this object format (array of objects)
        [ {
              name: <str [required]>,
              order: <int [optional, inferred from array index if not specified]>,
              type: <str [optional: default char -- note we're using noiceCoreUIFormView type alises]>,
              width: <int [optional, if you specify it, it's a CSS fr integer, if you don't it's "1fr"]>,
              sortFunction: (a,b)=>{...},
              editable: <bool>,
              valueChangeCallback: async (newVal, oldVal, self) => { ... }
              disableCellEdit: <bool default:false>
         }, ... ]

    * numRows
      read-only -- returns the number of data rows in the table

    * rows(<array-of-objects>)
      gets or sets rows in this object format (array of objects)
        [{ <col.name>:<col.value>, ...}, .. ]
      this data is stored solely in the DOM. Attributes not corresponding to an entry in 'columns'
      are echoed into the row's dataset. Getting this attribute, reconstructs the input objects
      from the DOM. Setting this attribute itterates calls to addRow();

    * data(<array-of-arrays>)
      accepts a standard 2D array-of-arrays (a spreadsheet analog if you will), this will interpret
      the first row as the header, interpolating each cell as a value for 'columns' attribute with
      default values (so all strings). getting this attribute exports the entire table including
      header into the array-of-arrays

    * maxListHeight(<CSS unit string>)
      sets the CSS max-height attribute on the tableListContainer (if you want scrolling, etc you'll need to set this)
      accepts any CSS-legal value for max-height

    * selectMode(<enum(none|single|multiple) defailt:"none">)
      sets the row select mode. self explanitory

    * allowColumnSort(<bool>)
      if set true column header cells are clickable [no-sort, ascending, descending]

    * rowSelectCallback(<async function(selectBool, listRowElement, selfReference)>)
      if specified await this callback before changing the select state of a row,
      rejecting the promise rejects the select state change

    * modifyRowCallback(<async function(rowElement, data)>)
      if specified, await output of this callback before updating the row with the specified data
      a rejected promise will abort the change. THe object returned from the resolved promise will
      replace <data> (so you can externally mutate the change if you need)

    * syncRowsBatchLimit (<int: default 250>)
      inside syncRows, only process this many rows within a single animationFrame to avoid smufring the UI thread

    * renderRowsProgressCallback(partial, complete, selfReference)
      if defined, sends progress updates from rows setter when rendering giagantor lists

    * allowCellEdit (bool: default false)
      if set true, allow cell edits unless the corresponding column has disableCellEdit: true

    * editCellCallback(<async function(rowElement, cellElement, selfReference)>)
      the user requests to edit a cell, whatever you return will get written to the column
      identified by col.name on the row represented by rowElement (the actual DOM element)
      could use a popup dialog, or try to do a fancy inline edit, but that's all external

    ## functions

    * addColumn({columnDef}, propagateBool)
      add a column to the DOM. This should get called from the columns attribute
      and yeah, it'll have to modify every existing row, if propagateBool is set true,
      call syncRows() which will add

    * removeColumn(col.name, propagateBool)
      remove the column with the specified name., if propagateBool is set true,
      call syncRows() which will remove

    * syncRows()
      descend all rows, and make sure each has the correct columns defined
      note: for truly huge tables we may need to do this on performance tuned batch sizes
      at animationFrame boundaries with a progressCallback. leme think on that this
      simply iterates all of the rowElements and calls renderCells on each of them

    * addRow({rowData})
      append a row containing the specified rowData to the table (the sequence of calls to this function
      will automatically set default sort order, so if that matters to you sort your array before sending
      to the 'rows' attribute).

    * getRowElement({rowData}, index, renderCellsBool)
      same as addRow() except it just returns the DOMElement with the specified rownum in the dataset
      called from addRow()
      DESIGN DECISION: this adds a null row div with all the data on the dataset then calls renderCells()
      on it -- its entirely possible we got the

    * renderCells(rowElement)
      render the cells according to the defined columns. If we find pre-existing cells that no longer have
      a mapped column, we remove them, if we find columns that are mapped but don't yet exist on the row
      we spawn them.

    * applyRowCSS(rowElement)
      just a centralized place for setting up the hard-coded CSS that makes it behave like a table
      called from addRow(0)

    * removeRow(rowIndex)
      deletes the row from the table at the specified index (index is 1-indexed, as header is row 0)

    * modifyRow(rowIndex, {data})
      perform data-modification on a row. If we have modifyRowCallback await it, yadda yadda

    * handleColumnSort(headerColumnElement)
      toggles the column header through it's sort states, re-sorting the table.

    * handleRowSelect(listRowElement, selectBool, recurseBypassBool)
      internally handles select/deselect on a row -- enforces the selectMode, awaits rowSelectCallback()
      if specified

    * clear()
      remove all data rows from the table

    * reset()
      [coded] remove all columns and rows from the table

    * getRow(index)
      return the data object and the corresponding DOMElement of the row at the specified index
      index is 1-indexed (header is row 0 and this function won't get it)

    * getSelected()
      return an array of all selected rows (output of getRow for all selected)
      obviously if selectMode: single, there's just the one and if it's none, nothing

    * deselectAll(forceBool)
      deselect all selected rows, if forceBool set true, bypass the rowSelectCallback()
      otherwise await them and abort if any of them reject

    * selectAll(forceBool)
      select all rows, same as deselectAll, if you set forceBool true, we'll ignore the selectCallback

    * handleCellEdit(rowElement, cellElement)
      if allowCellEdit: true, and editCellCallback is specified, call it and await output
      if resolved promise, send returned value to modifyRow() and let it call the modifyRowCallback() if specified

    ## CSS
    only layout-necessary CSS is hard coded. If you want it to look pretty
    you'll need some external CSS. This kinda looks nice if you ask me but hey
    whatever ya want:

        .noiceCoreUITable .tableContainer {
           box-shadow: 2px 2px 2px rgba(20, 22, 23, .3) inset;
           background: radial-gradient(ellipse at center, rgb(150, 167, 173), rgba(150, 167, 173, .6));
           color: rgb(24, 35, 38);
           padding: .25em;
           border-radius: .5em;
        }
        .noiceCoreUITable .hdrRow,.noiceCoreUITable .listRow {
           margin-bottom: .128em;
        }
        .noiceCoreUITable .hdrRow .hdrCol {
           border: 1px solid rgb(36, 36, 36);
           padding: .25em .128em .128em .25em;
           background-color: rgba(36, 36, 36,.1);
           border-radius: .25em;
        }
        .noiceCoreUITable .hdrRow .hdrCol[data-sort="descending"]:before {
           content: '\25BC';
           opacity: .5;
        }
        .noiceCoreUITable .hdrRow .hdrCol[data-sort="ascending"]:before {
           content: '\25B2';
           opacity: .5;
        }
        .noiceCoreUITable .hdrRow .hdrCol, .noiceCoreUITable .listRow .listCol {
           margin-right: .128em;
           padding: 0 .128em 0 .25em;
        }
        .noiceCoreUITable .listRow span.listCol {
           font-size: .8em;
        }
        .noiceCoreUITable .listRow[data-selected="true"] {
           background-color: rgba(240, 240, 240,.8);
           filter: invert(.85);
        }
*/
import { noiceCoreUIElement } from './noiceCoreUI.js';
import { noiceObjectCore } from './noiceCore.js';

class noiceCoreUITable extends noiceCoreUIElement {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:                   1,
        _className:                 'noiceCoreUITable',
        _columns:                   [],
        _rows:                      [],
        _data:                      [],
        _selectMode:                'none',
        _maxListHeight:             null,
        rowSelectCallback:          null,
        renderRowsProgressCallback: null,
        headerColClassName:         'hdrCol',
        headerRowClassName:         'hdrRow',
        dataRowClassName:           'listRow',
        dataRowColClassName:        'listCol',
        allowColumnSort:            false,
        allowCellEdit:              false,
        syncRowsBatchLimit:         250,
        debug:                      false
    },defaults),callback);

    this.setup();

} // end constructor




/*
    html getter
*/
get html(){
    return(`
        <div class="label" data-templatename="label" data-templateattribute="true"></div>
        <div class="tableContainer" data-templatename="tableContainer">
            <div class="tableHeader" data-templatename="tableHeader" data-templateattribute="true">
                <div data-templatename="headerRow" data-templateattribute="true"></div>
            </div>
            <div class="tableListContainer" data-templatename="tableListContainer" data-templateattribute="true"></div>
        </div>
    `)
}




/*
    setup()
*/
setup(){

    // setting these hardcoded in the html template doesn't work but setting it here does. well ok then!
    this._DOMElements.tableListContainer.style.display = "grid";
    this._DOMElements.tableListContainer.style.scrollbarWidth = "thin";
    this._DOMElements.tableListContainer.style.scrollbarGutter = "stable";
    this._DOMElements.tableListContainer.style.overflowY = "auto";
    //this._DOMElements.tableListContainer.style.width = "100%";
    this._DOMElements.tableListContainer.style.minWidth = "fit-content";
    this._DOMElements.headerRow.style.scrollbarWidth = "thin";
    this._DOMElements.headerRow.style.scrollbarGutter = "stable";
    //this._DOMElements.headerRow.style.overflowY = "auto";

    // yeah ok ... templates are for security bad mkay?
    this._DOMElements.tableHeader.className = this.headerRowClassName;

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
        let span = document.createElement('span');
        span.className = that.headerColClassName;
        span.dataset.name = col.name;
        span.dataset.sort = 'none';
        span.textContent = col.name;
        span.addEventListener('click', (evt) => { that.handleColumnSort(span); });
        that._DOMElements.headerRow.appendChild(span);
        that._columns.push(col);
        that.applyRowCSS(that._DOMElements.headerRow);
        if (propagateBool === true){ that.syncRows(); }
    }else{
        throw(`${that._className} v${that._version} | addColumn() | invalid input`);
    }
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
        that.headerRow = '';

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
    numRows attribute
    return the number of data rows in the table
*/
get numRows(){
    return(this._DOMElements.tableListContainer.querySelectorAll(`div.${this.dataRowClassName}`).length);
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
    this._DOMElements.tableListContainer.appendChild(this.getRowElement(row, (this.numRows + 1), (this.isNull(renderCellsBool) || (renderCellsBool === true))));
}




/*
    removeRow(idx)
    delete the row at the specified index. This is 1-indexed (so first row is 1)
*/
removeRow(idx){
    let el = this._DOMElements.tableListContainer.querySelector(`.${this.dataRowClassName}:nth-child(${idx})`);
    if (el instanceof Element){
        el.remove();
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
            that.columns.filter((b)=>{return(b.name == el.dataset.name)}).length == 0
        )}).forEach((el) =>{ el.remove(); });

        // spawn columns we're missing or update them if they're not -- in order which should make sure they're sorted properly (horizontally)
        that.columns.sort((a,b) => {return(a.order - b.order)}).forEach((col) =>{
            let el = rowElement.querySelector(`span.${that.dataRowColClassName}[data-name="${col.name}"]`);
            if (el instanceof Element){
                el.textContent = data.hasOwnProperty(col.name)?data[col.name]:'';
                rowElement.appendChild(el); // insures we're in the right order
            }else{
                let span = document.createElement('span');
                span.className = that.dataRowColClassName;
                span.dataset.name = col.name;
                span.dataset.locked = false;
                span.textContent = data.hasOwnProperty(col.name)?data[col.name]:'';
                span.style.overflow = "hidden";
                span.addEventListener('dblclick', (evt) => {
                    span.dataset.locked = true;
                    that.handleCellEdit(rowElement, span).then(() => { span.dataset.locked = false; }).catch((error) => {
                        span.dataset.locked = false;
                        throw(`${that._className} v${that._version} | cell edit click handler | handleCellEdit() threw unexpectedly: ${error}`);
                    });
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
    applyRowCSS(rowElement)
    calculate grid-template-columns and apply it to the specified row
    this is the "use CSS to make it look like an old school table" part
*/
applyRowCSS(el){
    let that = this;
    if (el instanceof Element){
        el.style.display = 'grid';
        el.style.cursor = 'default';
        el.style.userSelect = 'none';
        el.style.width = '100%';
        el.style.gridTemplateColumns = that.columns.sort((a,b) => {return(a.order - b.order)}).map((col) => {
            let width = ((col instanceof Object) && col.hasOwnProperty('width') && that.isNotNull(col.width))?col.width:1;
            return(
                `${width}${/^\d+$/.test(width)?'fr':''}`
            )
        }).join(" ");
    }
}




/*
    syncRows(progressCallback)
    update every single row by calling renderCells on it
    (which in turn calls applyRowCSS)

    this executes on animationFrames, we batch rows into
    gropus of this.syncRowsBatchLimit

    as such is is async. We will call progressCallback(partial, complete, selfReference)
    if specified.
*/
syncRows(progressCallback){
    let that = this;
    return(new Promise((toot, boot) => {
        let chunks = [];
        let queue = Array.from(this._DOMElements.tableListContainer.querySelectorAll(`div.${that.dataRowClassName}`));
        let complete = queue.length;
        while (queue.length > 0){ chunks.push(queue.splice(0, this.syncRowsBatchLimit)); }
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
        that.tableListContainer = '';
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
    maxListHeight attribute
    if not set, the height of the rendered table is unbounded
    if that's not what you want you can set the max-height CSS
    attribute of this.tableListContainer in any supported CSS units you like
    this will provoke the scrollbar and sticky header via the hard-coded CSS
*/
get maxListHeight(){
    return(this._DOMElements.tableListContainer.style.maxHeight)
}
set maxListHeight(v){
    this._DOMElements.tableListContainer.style.maxHeight = v;
}




/*
    selectMode attribute
    enum: 'none', 'single', 'multiple'
*/
get selectMode(){ return(this._selectMode); }
set selectMode(v){
    if (this.isNotNull(v) && (['none', 'single', 'multiple'].indexOf(v) >= 0)){
        this._selectMode = v;
    }else{
        throw(`${that._className} v${that._version} | selectMode attribute setter (${v}) | invalid input`);
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
        if (newSelectState == (listRowEl.dataset.selected == "true")){
            if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | no select state change | exit`); }
            toot(false);
        }else{
            if (['single', 'multiple'].indexOf(that.selectMode) >= 0){
                new Promise((_t,_b) => {
                    if ((that.selectMode == 'single') && (! (recurseBypassBool == true))){
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
                            toot(true);
                        }).catch((error) => {
                            if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | rowSelectCallback() threw unexpectedly: ${error}`); }
                            boot(error);
                        });
                    }else{
                        listRowEl.dataset.selected = newSelectState;
                        toot(true);
                    }
                }).catch((error) => {
                    // deselect for selectMode: single aborted
                    if (that.debug){ console.log(`${that._className} v${that._version} | handleRowSelect(${listRowEl.dataset.rownum}, ${newSelectState}) | failed to deselect at least one previously selected row for selectMode:singl |  rowSelectCallback() threw unexpectedly: ${error}`); }
                    boot(error);
                })
            }else{
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
    totes obvs: this does not a thing if selectMode != 'multiple'
*/
selectAll(forceBool){
    let that = this;
    return(Promise.all(Array.from(that._DOMElements.tableListContainer.querySelectorAll(`.${that.dataRowClassName}[data-selected="false"]`)).map((el) => {
        return(new Promise((toot, boot) => {
            if (! that.selectMode == "multiple"){
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
    this.tableListContainer = '';
}




/*
    reset()
    remove all data rows and all columns from the table
*/
reset(){
    this.clear();
    this.columns = [];
    this.headerRow = '';
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
    handleCellEdit(rowElement, cellElement)
    if allowCellEdit: true, and editCellCallback is specified, call it and await output
    if resolved promise, send returned value to modifyRow() and let it call the modifyRowCallback() if specified
*/
handleCellEdit(rowElement, cellElement){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (that.allowCellEdit == true) &&
            (that.editCellCallback instanceof Function) &&
            (that.columns.filter((a)=>{return(
                (a.name == cellElement.dataset.name) && (! (a.hasOwnProperty('disableCellEdit') && (a.disableCellEdit === true)))
            )}).length == 1)
        ){
            // do all the things
            that.editCellCallback(rowElement, cellElement, that).then((value) => {

                // we need a call to modifyRowCallback here first ...
                new Promise((_t,_b) =>{
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
                        if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | renderCells() threw unexpectedly: ${error}`); }
                        boot(error);
                    }
                }).catch((error) => {
                    if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | modifyRowCallback() threw unexpectedly: ${error}`); }
                    boot(error);
                });
            }).catch((error) => {
                if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | editCellCallback() threw unexpectedly: ${error}`); }
                boot(error);
            });
        }else{
            if (that.debug){ console.log(`${that._className} v${that._version} | handleCellEdit() | cellEdit disabled`); }
            toot(false);
        }
    }));
}




}
export { noiceCoreUITable };
