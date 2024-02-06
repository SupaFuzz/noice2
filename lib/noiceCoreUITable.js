/*
    noiceCoreUITable.js
    2/2/24
    this models your standard row-column table
    with a header and some options:

        * [done] sortable column headers (options TBD)

        * [done] getRow(idx)
          return unto me the row in {colName:<value>, ... } format at the specified index
          (1 indexed, 0 is the header), else return null (no throwin', play nice now!)

        * [done] selected getter (or something like that)
          return unto me the row(s) that are selected

        * [done] deselectAll() -- just deselect all the rows if any are selected
          (respecting the callbacks of courses)

        * [done] selectMode (enum: none | single | multiple)

        * [done] async rowSelectCallback(selectBool, rowRef, selfRef)
          callback can abort focus change by rejecting promise, also gets called on deselect
          allowing extension to something like a focus manager

        * [done] addRow({row})
        * [done] deleteRow({rowIndex})

        * editable fields (if enabled)

        * some kinda csv export options -- which actually ...
          might model this better as a callback or something but a built-in button or something
          dunno, gotta think more on how we wanna model data stuff

        yeah ok data stuff

        attributes:

            * [done] columns
              gets or sets column definitions in this object format (array of objects)
              [ {
                    name: <str [required]>,
                    order: <int [optional, inferred from array index if not specified]>,
                    type: <str [optional: default char -- note we're using noiceCoreUIFormView type alises]>,
                    width: <int [optional, if you specify it, it's a CSS fr integer, if you don't it's "1fr"]>,
                    sortFunction: (a,b)=>{...},
                    editable: <bool>,
                    valueChangeCallback: async (newVal, oldVal, self) => { ... }
               }, ... ]

            * [done] rows
              gets or sets rows in this object format (array of objects)
              [{ <col.name>:<col.value>, ...}, .. ]

            * [done] data
              some kinda all in one dumb literal 2d array setter/getter, everything default
              values with inferred first row is header column names

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
               margin: 0 .128em 0 .128em;
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
        _version:            1,
        _className:          'noiceCoreUITable',
        _columns:            [],
        _rows:               [],
        _data:               [],
        _selectMode:         'none',
        _maxListHeight:     null,
        rowSelectCallback:   null,
        headerColClassName:  'hdrCol',
        headerRowClassName:  'hdrRow',
        dataRowClassName:    'listRow',
        dataRowColClassName: 'listCol',
        allowColumnSort:     false,
        debug:               false
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
            <div class="tableHeader" data-templatename="tableHeader" data-templateattribute="true"></div>
            <div class="tableListContainer" data-templatename="tableListContainer" data-templateattribute="true"></div>
        </div>
    `)
}




/*
    setup()
*/
setup(){
    let that = this;

    // render the table
    that.renderTable();
}




/*
    columns
*/
get columns(){ return(this._columns); }
set columns(v){
    let that = this;
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Object) && a.hasOwnProperty('name') && that.isNotNull(a.name)}).length)
    ){
        that._columns = v;
    }else{
        throw(`${that._className} v${that._version} | columns attribute setter | invalid input format`);
    }
}




/*
    rows
*/
get rows(){ return(this._rows); }
set rows(v){
    let that = this;
    if (
        (v instanceof Array) &&
        (v.length == v.filter((a)=>{return(a instanceof Object)}).length)
    ){
        that._rows = v;
    }else{
        throw(`${that._className} v${that._version} | rows attribute setter | invalid input format`);
    }
}




/*
    data
    this attribute returns a plain 2d array including the header
    just literally a dumb spreadsheet of strings
*/
get data(){
    let that = this;
    let out = [];

    // header
    out.push(that.columns.sort((a,b) => {return(a.order - b.order)}).map((col)=>{return(col.name)}));

    // rows
    return(
        out.concat(
            (that.rows.filter((row)=>{return(row instanceof Object)}).map((row) => {return(
                that.columns.sort((a,b) => {return(a.order - b.order)}).map((col) => {return(
                    row.hasOwnProperty(col.name)?row[col.name]:''
                )})
            )}))
        )
    );
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
        that.renderTable();

    }else{
        // bad data format
        throw(`${this._className} v${this._version} | data attribute setter | invalid input data format`)
    }
}



/*
    maxListHeight
*/
get maxListHeight(){ return(this._maxListHeight); }
set maxListHeight(v){
    this._maxListHeight = v;
    if (this._DOMElements.tableListContainer instanceof Element){
        if (this.isNotNull(this._maxListHeight)){
            this._DOMElements.tableListContainer.style.maxHeight = this._maxListHeight;
        }else{
            this._DOMElements.tableListContainer.style.maxHeight = null;
        }
    }
}




/*
    selectMode
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
    renderTable()
    this completely nukes whatever was there and sets up a fresh table
*/
renderTable(){
    let that = this;
    that.renderColumns();
    that.renderRows();
}




/*
    renderColumns()
*/
renderColumns(){
    let that = this;

    // make new header and replace the old one
    that.tableHeader = '';
    that.headerRowEl = document.createElement('div');
    that.headerRowEl.className = that.headerRowClassName;
    that.headerRowEl.style.scrollbarWidth = 'thin';
    that.headerRowEl.style.scrollbarGutter = 'stable';
    that.headerRowEl.style.overflowY = 'auto';
    that.headerRowEl.insertAdjacentHTML(
        'afterbegin',
        that.columns.sort((a,b) => {return(a.order - b.order)}).map((col) => {
            return(
            `<span class="${that.headerColClassName}" data-name="${col.name}" data-sort="none">${col.name}</span>`
        )}).join("")
    );
    that.applyRowCSS(that.headerRowEl);
    that.tableHeader = that.headerRowEl;

    // setup handlers for the sort stuff
    that.headerRowEl.querySelectorAll(`span.${that.headerColClassName}`).forEach((el) => {
        el.addEventListener('click', (evt) => {that.handleColumnSort(el)})
    });

}




/*
    renderRows()
*/
renderRows(){
    let that = this;
    that.tableListContainer = '';

    // new hotness
    //that._DOMElements.tableListContainer.insertAdjacentHTML('afterbegin', that.rows.filter((a)=>{return(a instanceof Object)}).map((a,idx)=>{return(that.getRowElement(a,idx))}).join(""));
    that.rows.filter((a)=>{return(a instanceof Object)}).forEach((row, idx) => {
        that._DOMElements.tableListContainer.appendChild(that.getRowElement(row, idx));
    });

    that._DOMElements.tableListContainer.style.scrollbarWidth = 'thin';
    that._DOMElements.tableListContainer.style.scrollbarGutter = 'stable';
    that._DOMElements.tableListContainer.style.overflowY = 'auto';
    that._DOMElements.tableListContainer.style.width = '100%';
}




/*
    getRowElement(row, idx)
    idx being the value of dataset.osortorder -- this is it's default numeric sort order
*/
getRowElement(row, idx){
    let that = this;
    if (row instanceof Object){
        let div = document.createElement('div');
        div.className = that.dataRowClassName;
        div.dataset.selected = "false";
        div.dataset.osortorder = isNaN(parseInt(idx))?0:parseInt(idx);
        div.dataset.rownum = div.dataset.osortorder; // i'm not sure why I have done this but okay
        that.columns.sort((a,b) => {return(a.order - b.order)}).map((col) => {
            let span = document.createElement('span');
            span.className = that.dataRowColClassName;
            span.dataset.name = col.name;
            span.dataset.sort = "none";
            span.textContent = ((row instanceof Object) && row.hasOwnProperty(col.name))?row[col.name]:'';
            return(span);
        }).forEach((col)=>{ div.appendChild(col); });
        that.applyRowCSS(div);
        div.addEventListener('click', (evt) => { that.handleRowSelect(div); });
        return(div);
    }else{
        throw(`${that._className} v${that._version} | getRowElement() | invalid input`);
    }
}




/*
    addRow(rowData)
*/
addRow(rowData){
    let that = this;
    if (rowData instanceof Object){
        that.rows.push(rowData);
        that._DOMElements.tableListContainer.appendChild(that.getRowElement(rowData, that.rows.length));
        //that._DOMElements.tableListContainer.insertAdjacentHTML('beforeend', that.getRowElement(rowData, (that.rows.length)));
    }else{
        throw(`${that._className} v${that._version} | addRow() | invalid input`);
    }
}




/*
    deleteRow(rowIndex)
    rowIndex is 1-indexed (0 is the header)
    we return the corresponding row data object (which could potentially
    contain more columns than the table), which we will not have deleted
    from the rows object for reasons of not wanting to update a potential
    bajillion rows with new rownumbers, but we will replace the array
    entry with the null object
*/
deleteRow(idx){
    let that = this;
    if (
        (! isNaN(parseInt(idx))) &&
        (parseInt(idx) > 0) &&
        (parseInt(idx) < that.rows.length)
    ){
        let el = that._DOMElements.tableListContainer.querySelector(`.${that.dataRowClassName}:nth-child(${idx})`);
        if (
            (el instanceof Element) &&
            (el.dataset) &&
            (!isNaN(parseInt(el.dataset.rownum))) &&
            (parseInt(el.dataset.rownum) >= 0) &&
            (parseInt(el.dataset.rownum) <= that.rows.length)
        ){
            let out = JSON.parse(JSON.stringify(that.rows[parseInt(el.dataset.rownum)]));
            that.rows[parseInt(el.dataset.rownum)] = null;
            el.style.display = "none";
            el.dataset.deleted = true;
            return(out);
        }else{
            throw(`${that._className} v${that._version} | deleteRow(${idx}) | css query for n-th-child(${idx}) failed match?`);
        }
    }else{
        throw(`${this._className} v${this._version} | deleteRow(${rowIndex}) | invalid input`);
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
        el.style.gridTemplateColumns = that.columns.sort((a,b) => {return(a.order - b.order)}).map((col) => {return(
            `${((col instanceof Object) && col.hasOwnProperty('width') && that.isNotNull(col.width))?col.width:1}fr`
        )}).join(" ");
    }
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
                    return(parseInt(a.dataset.osortorder) - parseInt(b.dataset.osortorder))
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
    clearColumnSort(headerColumnElement)
    reset it to none
*/
clearColumnSort(headerColumnElement){
    // TO-DO
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
    reset()
    just blow away all of the table content
*/
reset(){
    this.tableHeader = '';
    this.tableListContainer = '';
}




/*
    getRow(index)
    return unto me the row in {colName:<value>, ... } format at the specified index
    (1 indexed, 0 is the header), else return null (no throwin', play nice now!)
*/
getRow(idx){
    let that = this;
    let rowNum = parseInt(idx);
    if (isNaN(rowNum) || (rowNum < 1) || (rowNum > that.rows.length)){
        if (that.debug){ console.log(`${that._className} v${that._version} | getRow(${idx}) | invalid index`); }
        return(null);
    }else{
        let el = that._DOMElements.tableListContainer.querySelector(`.${that.dataRowClassName}:nth-child(${idx})`);
        if (
            (el instanceof Element) &&
            (el.dataset) &&
            (!isNaN(parseInt(el.dataset.rownum))) &&
            (parseInt(el.dataset.rownum) >= 0) &&
            (parseInt(el.dataset.rownum) <= that.rows.length) // tricky -- these are 1 indexes, so the last element is length+1 in this context
        ){
            return(that.rows[parseInt(el.dataset.rownum)]);
        }else{
            if (that.debug){ console.log(`${that._className} v${that._version} | getRow(${idx}) | css query for n-th-child(${idx}) failed match?`); }
            return(null);
        }
    }
}




/*
    getSelected()
    return data for row (or rows if selectMode:multiple) that are selected
*/
getSelected(){
    let that = this;
    return (Array.from(that._DOMElements.tableListContainer.querySelectorAll(`.${that.dataRowClassName}[data-selected="true"]`)).map((el) => {
        return(
            (
                (el instanceof Element) &&
                (el.dataset) &&
                (!isNaN(parseInt(el.dataset.rownum))) &&
                (parseInt(el.dataset.rownum) >= 0) &&
                (parseInt(el.dataset.rownum) <= that.rows.length)
            )?that.rows[parseInt(el.dataset.rownum)]:{}
        )
    }))
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







}
export { noiceCoreUITable };
