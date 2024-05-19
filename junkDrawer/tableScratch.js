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
    handleCellEdit(rowElement, cellElement)
    if allowCellEdit: true, and editCellCallback is specified, call it and await output
    if resolved promise, send returned value to modifyRow() and let it call the modifyRowCallback() if specified
*/











}
export { noiceCoreUITable };
