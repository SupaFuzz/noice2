# noiceCoreUITable.js

2/6/24 - Amy Hicox <amy@hicox.com>

this implements a table UI, not using the venerable <table> element on account of it being the unruly ancient beast that it is, but instead opting for good old divs and spans and CSS grid. This is fairly fully featured.

## synopsis
``` JavaScript

import { noiceCoreUITable } from 'noiceCoreUITable.js';

// make a table and place it on the screen
let testTable = new noiceCoreUITable({
    label: "test table",
    allowColumnSort: true,
    columns: [
        { name: 'species', order: 1, type: 'char' },
        { name: 'first', order: 2, type: 'char' },
        { name: 'middle', order: 3, type: 'char', width: .5 },
        { name: 'last', order: 4, type: 'char' },
        { name: 'num', order: 5, type: 'int'}
    ],
    rows: [
        { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1 },
        { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12 },
    ],
    selectMode: 'single',
    rowSelectCallback: async (selectBool, rowElement, selfRef) => {
        console.log(`rowSelectCallback: ${selectBool} | ${rowElement.dataset.rownum}`);
        return(true)
    },
    allowCellEdit: true,
    editCellCallback: async (rowElement, cellElement) => {
        console.log(`inside editCellCallback with: ${rowElement.dataset.rownum} / ${cellElement.dataset.name}`);
        return("this is test");
    },
    modifyRowCallback:  async(row, data) => {
        console.log(`inside modifyRowCallback`);
        return(data);
    }
}).append(document.body)


// add a row
testTable.addRow({
    species: 'canine',
    first: 'Scooby',
    middle: 'D',
    last: 'Doo',
    num: 420
});


// remove a row
testTable.removeRow(2);

// get a row
let row = testTable.getRow(1);

// modiy a row
testTable.modifyRow(1, {species: 'cat'}).then(() => {
    // do some things
});

// make an instant table with an array of arrays
testTable.data = [
    ["type", "name", "quantity"],
    ["fruit", "grape", "2"],
    ["veggie", "celery", "5 "]
];

// there's a lot more but that's the basics
```


## attributes

* **columns** `array-of-objects`
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

* **numRows** `int`
  read-only -- returns the number of data rows in the table

* **rows** `array-of-objects`
  gets or sets rows in this object format (array of objects)
    ```[{ <col.name>:<col.value>, ...}, .. ]```
  this data is stored solely in the DOM. Attributes not corresponding to an entry in 'columns'
  are echoed into the row's dataset. Getting this attribute, reconstructs the input objects
  from the DOM. Setting this attribute iterates calls to `addRow()`;

* **data** `array-of-arrays`
  accepts a standard 2D array-of-arrays (a spreadsheet analog if you will), this will interpret
  the first row as the header, interpolating each cell as a value for 'columns' attribute with
  default values (so all strings). getting this attribute exports the entire table including
  header into the array-of-arrays

* **maxListHeight** `CSS unit string`
  sets the CSS max-height attribute on the `tableListContainer` (if you want scrolling, etc you'll need to set this)
  accepts any CSS-legal value for max-height

* **selectMode** `enum(none|single|multiple) defailt:"none"`
  sets the row select mode. self explanitory

* **allowColumnSort** `bool`
  if set true column header cells are clickable [no-sort, ascending, descending]

* **rowSelectCallback** `async function(selectBool, listRowElement, selfReference)`
  if specified await this callback before changing the select state of a row,
  rejecting the promise rejects the select state change

* **modifyRowCallback** `async function(rowElement, data)`
  if specified, await output of this callback before updating the row with the specified data
  a rejected promise will abort the change. THe object returned from the resolved promise will
  replace <data> (so you can externally mutate the change if you need)

* **syncRowsBatchLimit** `int default: 250`
  inside syncRows, only process this many rows within a single animationFrame to avoid smufring the UI thread

* **renderRowsProgressCallback** `function(partial, complete, selfReference)`
  if defined, sends progress updates from rows setter when rendering giagantor lists

* **allowCellEdit** `bool default: false`
  if set true, allow cell edits unless the corresponding column has disableCellEdit: true

* **editCellCallback** `async function(rowElement, cellElement, selfReference)`
  the user requests to edit a cell, whatever you return will get written to the column
  identified by col.name on the row represented by rowElement (the actual DOM element)
  could use a popup dialog, or try to do a fancy inline edit, but that's all external

## functions

* `addColumn({columnDef}, propagateBool)`
  add a column to the DOM. This should get called from the columns attribute
  and yeah, it'll have to modify every existing row, if propagateBool is set true,
  call syncRows() which will add

* `removeColumn(col.name, propagateBool)`
  remove the column with the specified name., if propagateBool is set true,
  call syncRows() which will remove

* `syncRows()`
  descend all rows, and make sure each has the correct columns defined
  note: for truly huge tables we may need to do this on performance tuned batch sizes
  at animationFrame boundaries with a progressCallback. leme think on that this
  simply iterates all of the rowElements and calls renderCells on each of them

* `addRow({rowData})`
  append a row containing the specified rowData to the table (the sequence of calls to this function
  will automatically set default sort order, so if that matters to you sort your array before sending
  to the 'rows' attribute).

* `getRowElement({rowData}, index, renderCellsBool)`
  same as `addRow()` except it just returns the DOMElement with the specified rownum in the dataset
  called from `addRow()`

* `renderCells(rowElement)`
  render the cells according to the defined columns. If we find pre-existing cells that no longer have
  a mapped column, we remove them, if we find columns that are mapped but don't yet exist on the row
  we spawn them.

* `applyRowCSS(rowElement)`
  just a centralized place for setting up the hard-coded CSS that makes it behave like a table
  called from addRow(0)

* `removeRow(rowIndex)`
  deletes the row from the table at the specified index (index is 1-indexed, as header is row 0)

* `modifyRow(rowIndex, {data})`
  perform data-modification on a row. If we have modifyRowCallback await it, yadda yadda

* `handleColumnSort(headerColumnElement)`
  toggles the column header through it's sort states, re-sorting the table.

* `handleRowSelect(listRowElement, selectBool, recurseBypassBool)`
  internally handles select/deselect on a row -- enforces the selectMode, awaits rowSelectCallback()
  if specified

* `clear()`
  remove all data rows from the table

* `reset()`
  remove all columns and rows from the table

* `getRow(index)`
  return the data object and the corresponding DOMElement of the row at the specified index
  index is 1-indexed (header is row 0 and this function won't get it)

* `getSelected()`
  return an array of all selected rows (output of getRow for all selected)
  obviously if selectMode: single, there's just the one and if it's none, nothing

* `deselectAll(forceBool)`
  deselect all selected rows, if forceBool set true, bypass the `rowSelectCallback()`
  otherwise await them and abort if any of them reject

* `selectAll(forceBool)`
  select all rows, same as `deselectAll()`, if you set forceBool true, we'll ignore the `selectCallback`

* `handleCellEdit(rowElement, cellElement)`
  if `allowCellEdit: true`, and `editCellCallback` is specified, call it and await output
  if resolved promise, send returned value to` modifyRow()` and let it call the `modifyRowCallback()` if specified

* `defaultCellEditCallback(rowElement, cellElement, selfRef)`
   when setting `allowCellEdit` true, if no `editCellCallback` is specified, this built-in cellEditor is used.
   this is very basic but works well enough. This is a good template for extending into fancier cell editors
   that for instance, respect types and constraints on the corresponding column definition etc.

## CSS
only layout-necessary CSS is hard coded. If you want it to look pretty
you'll need some external CSS. This kinda looks nice if you ask me but hey
whatever ya want:

```CSS
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
}```
