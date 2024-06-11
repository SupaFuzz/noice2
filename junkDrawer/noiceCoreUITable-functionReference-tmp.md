* constructor(args, defaults, callback)

* `html` (<str> read-only)

* setup()

* addColumn(col, propagateBool)

* getHeaderCell(col)
  *get a header cell element for the specified column*

* removeColumn(colName, propagateBool)

* toggleColumnVisibility(colName, visibilityBool)

* `columns` (<array of objects> read-write)

* `numRows` (<int>, read-only)

* `numSelectedRows` (<int>, read-only)

* getRowElement(row, rownum, renderCellsBool)
  *get an empty row element with cell data encoded on .dataset.rowdata*

* addRow(rowData, renderCellsBool)

* removeRow(idx)
  *where `idx` is the 1-indexed row number in the table*

* getRow(idx)
  *return this dataStructure for the given row: {data: {<fieldName>:<fieldValue>}, DOMElement: <RowElement>}*


* modifyRow(idx, data)
  *update the row at the 1-indexed `idx` with specified `data` object values*

* renderCells(rowElement)

* applyRowCSS(rowElement)

* syncRows(progressCallback)

* `rows` (<array of objects> read-write)

* `data` (<array of arrays> read-write)

* `maxListHeight` (<cssUnitsString> read-write)

* `selectMode` (<enum: none|single|multiple> read-write)

* handleRowSelect(listRowEl, selectBool, recurseBypassBool)

* getSelected()
  *returns an array of all selected rows*

* deselectAll(forceBool)

* selectAll(forceBool)

* clear()
  *remove all data rows from the table*

* reset()
  *remove all data rows and the header*

* handleColumnSort(hdrColEl)

* `allowCellEdit` (<bool> read-write)

* handleCellEdit(rowElement, cellElement)
  *this is essentially the dblclick handler for cells piping to editCellCallback()*

* modifyCellValue(rowElement, cellElement, value)
  *this sets the value on rowElement.dataset.rowdata then calls renderCells, but will passthrough `modifyRowCallback` if specified*

* `modifyAll` <enum: auto|prompt>
  *controls propagation of cell edits when selectMode:multiple and more than one row selected*

* defaultCellEditCallback(rowElement, cellElement, selfRef)
  *super-basic default inline cell editor -- treats everything as a string, no input validation*

* `showFooter` (<bool>, read-write)

* `showBtnPrefs` (<bool>, read-write)

* `showBtnSelectAll` (<bool>, read-write)

* `showBtnSelectNone` (<bool>, read-write)

* `showBtnExport` (<bool>, read-write)

* `showFooterMessage` (<bool>, read-write)

* `showRowNudgeButtons` (<bool>, read-write)

* getFooterMessage()
  *controls button states after select/add/remove operations, calls `getFooterMessageCallback` if specified and updates footer message*

* `getFooterMessageCallback` (<DOMTree>, read-only)
  *the default footer message*

* openPanel(DOMTree)
  *open the blocking modal dialog panel and place the given DOMTree into it*

* closePanel()
  *removes the modal dialog panel*

* openPrefEditor(evt)
  *open the column editor in the modal dialog*

* getPrefEditor()
  *returns the output of getPrefEditorCallback(), which maps to `defaultPrefEditor` if not externally specified*

* `defaultPrefEditor` (<DOMTree> read-only)
  *the default column editor UI*

* userQuery(args)
  *generic modal dialog with prompt, detail and exit buttons options*

* handleSelectAll(evt)
  *select all rows in `syncRowsBatchLimit` numbered chunks aligned to animationFrames*

* handleSelectNone(evt)
  *inverse of handleSelectAll(), also aligned to animationFrames to avoid thrad smurfing*

* openExportUI()
  *setup the CSV export UI, then call openPanel() on it*

* getCSVExport(exportSelectedOnlyBool, pieChart, explainerEl, linkEl)
  *place exported CSV file data on provied link for all or selected rows -- note export also on animationFrames to avoid the thred-smurf*

* encodeCSVRow(array)
  *handles CSV encoding*

* decodeHTMLEntities(string)
  *somewhat inefficient but effective decoding of HTML entities in strings to make CSV export safe*

* moveRow(rowElement, toIndex)

* nudgeSelection(dir, distance)
