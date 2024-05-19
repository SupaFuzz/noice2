/*
    tableScratch.js
    5/17/28

    this is noiceCoreUITable.js with the bits edited out that have been
    ported to wcTable.js. This is the to-do list for wcTable basically
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
        _rows:                        [],
        _data:                        [],
        _selectMode:                  'none',
        _maxListHeight:               null,
        _listHeight:                  null,
        _defaultFooterMessage:        null,
        _customButtons:               [],
        _modifyAll:                   'auto', // values: 'auto' or 'prompt'
        rowSelectCallback:            null,
        renderRowsProgressCallback:   null,
        headerColClassName:           'hdrCol',
        headerRowClassName:           'hdrRow',
        dataRowClassName:             'listRow',
        dataRowColClassName:          'listCol',
        defaultCellEditorInputClass:  'cellEditor',
        defaultPrefUIClass:           'tablePrefEditor',
        defaultPrefUIEditorClass:     'defaultPrefUIEditor',
        userPromptClass:              'userPrompt',
        exportUIClass:                'exportUI',
        syncRowsBatchLimit:           250,
        exportFileName:               null,
    },defaults),callback);

    this.setup();

} // end constructor





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
                that.editCellCallback(rowElement, cellElement, that).then((value) => {

                    // if we're in modify mode and modifyAll: prompt is set ...
                    new Promise((_t,_b) => {

                        let colRef = that.columns.filter((a) => {return(a.name == cellElement.dataset.name)})[0];
                        let dma = ((colRef instanceof Object) && colRef.hasOwnProperty('disableModifyAll') && (colRef.disableModifyAll == true));

                        if ((that.selectMode == 'multiple') && (that.numSelectedRows > 1) && (! dma)){
                            if (that.modifyAll == "prompt"){
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
                            }else if (that.modifyAll == "auto"){
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
    modifyAll (bool)
*/
get modifyAll(){ return(this._modifyAll); }
set modifyAll(v){
    if (['auto', 'prompt'].indexOf(v) >= 0){
        this._modifyAll = v;
    }else{
        throw(`${this._className} v${this._version} | modifyAll(${v}) attribute setter: invalid input`);
    }
}




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
export { noiceCoreUITable };
