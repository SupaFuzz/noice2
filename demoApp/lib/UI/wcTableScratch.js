/*
    wcTableScratch.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcTable } from '../../../lib/webComponents/wcTable.js';
wcTable.registerElement('wc-table');

class wcTableScratch extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'wcTableScratch',
            debug: false,
            themeStyle: null
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <h1>Web Component Table Scratch</h1>
    <div class="btnContainer" data-templatename="btnContainer" data-templateattribute="true">
        <button id="btnMakeTable">make table</button>
    </div>
    <div class="testStuff" data-templatename="testStuff" data-templateattribute="true"></div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;
    that.DOMElement.style.display = "grid";
    that.DOMElement.style.height = "100%";
    that.DOMElement.style.alignContent = "baseline";
    that.DOMElement.style.gridTemplateRows = 'auto auto auto';

    that.DOMElement.querySelector('#btnMakeTable').addEventListener('click', (evt) => { that.spawnTable(); });
}




/*
    spawnTable()
    make one and put it on the screen
*/
spawnTable(){
    this.testTable = new wcTable({
        columns: [
            { name: 'species', order: 1, type: 'char', width: '5em', disableCellEdit: true, visible:false },
            { name: 'first', order: 2, type: 'char', width: '10em', disableModifyAll: true },
            { name: 'middle', order: 3, type: 'char', width: '5em' },
            { name: 'last', order: 4, type: 'char', width: '10em' },
            { name: 'num', order: 5, type: 'int', width: '5em' }
        ],
        /*
        rows: [
            { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
            { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
            { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
            { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
            { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
            { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
        ],
        allow_column_sort: true,
        */
        label: "test table",
        footer_message: "helloooooo!"
    });
    this._DOMElements.testStuff.appendChild(this.testTable);
}




/*
    gainFocus()
    the UI is gaining focus from a previously unfocused state
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){


        // be outa here wit ya badass ...
        toot(true);
    }));
}




/*
    losefocus(forusArgs)
    fires every time we gain focus
*/
loseFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




}
export { wcTableScratch };
