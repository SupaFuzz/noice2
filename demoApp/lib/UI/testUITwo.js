/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { noicePieChart } from '../../../lib/noicePieChart.js';
import { noiceCoreUITable } from '../../../lib/noiceCoreUITable.js';

class testUITwo extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'testUITwo',
            pies: {},
            debug: false
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <div class="chartContainer" data-templatename="chartContainer" data-templateattribute="true"></div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;

    // fix layout for chart grid stuffs
    that.DOMElement.style.alignItems = 'baseline';
    that.DOMElement.style.justifyContent = 'flex-start';
    that._DOMElements.chartContainer.style.padding = '1em';

    // placeholder message
    let bs = document.createElement('h1');
    bs.style.width="max-content";
    bs.textContent = `${that._className} v${that._version} | work in progress`
    that.chartContainer = bs;

    /*
        do thine setup here ye verily

        LOH 2/2/24 @ 1723
        next step: try to instantiate a noiceCoreUITable and see what breaks
        it at least compiles so ... hey!

    */

    // 2/2/24 @ 2030 -- I'm bored and I don't have anything better to do ...
    that.testTable = new noiceCoreUITable({
        columns: [
            { name: 'species', order: 1, type: 'char' },
            { name: 'first', order: 2, type: 'char' },
            { name: 'middle', order: 3, type: 'char', width: '5em' },
            { name: 'last', order: 4, type: 'char' },
            { name: 'num', order: 5, type: 'int'}
        ],
        rows: [
            { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
            { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
            { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
            { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
            { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
            { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
        ],
        // maxListHeight: '5em',
        debug: false,
        selectMode: 'single',
        rowSelectCallback: async (selectBool, rowElement, selfRef) => {
            console.log(`rowSelectCallback: ${selectBool} | ${rowElement.dataset.rownum}`);
            return(true)
        },
        allowColumnSort: true,
        label: "test table",
        /*
        syncRowsBatchLimit: 1,
        renderRowsProgressCallback: (partial, complete, selfReference) => {
            console.log(`${partial}/${complete} (${Math.floor(partial/complete*100)})`);
        }
        */
        allowCellEdit: true,
        //editCellCallback: async (rowElement, cellElement, tableRef) => { return(that.handleCellEdit(rowElement, cellElement, tableRef)); },
        modifyRowCallback:  async(row, data) => {
            console.log(`inside modifyRowCallback`);
            console.log(row);
            console.log(data);
            return(data);
        },
        showFooterMessage: true,
        showBtnPrefs: true,
    }).append(that._DOMElements.chartContainer);

}




/*
    handleCellEdit(rowElement, celElement, tableRef)
*/
handleCellEdit(rowElement, cellElement, tableRef){
    let that = this;
    return(new Promise((toot, boot) => {

        let c = cellElement.getBoundingClientRect();


        // make an editor I guess, or something like that
        let inp = document.createElement('input');
        inp.setAttribute('type', 'text');
        inp.value = cellElement.textContent;
        inp.style.width = `${(c.width - 4)}px`;
        inp.addEventListener('focusout', (evt) => {
            let v = inp.value;
            inp.remove();
            toot(v);
        });
        inp.addEventListener('keydown', (evt) => {
            if (evt.keyCode == 13){ inp.blur(); }
        });

        cellElement.innerHTML = '';
        cellElement.appendChild(inp);

    }));
}


/*
    firstFocusCallback(focusArgs)
    this gets called once on the first focus (might need it might not dunno)
*/
firstFocusCallback(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




/*
    gainfocus(forusArgs)
    fires every time we gain focus
*/
gainFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
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
export { testUITwo };
