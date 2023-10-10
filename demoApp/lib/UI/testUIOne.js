/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { noicePieChart } from '../../../lib/noicePieChart.js';
import { noiceBarChart } from '../../../lib/noiceBarChart.js';

class testUIOne extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'testUIOne',
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
    <div class="btnContainer" data-templatename="btnContainer" data-templateattribute="true">
        <button class="btnTest" data-current="true">Test Button</button>
        <span class="testNote" data-templatename="testNote" data-templateattribute="true"></span>
    </div>
    <div class="chartContainer" data-templatename="chartContainer" data-templateattribute="true"></div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;

    /* fix layout for chart grid stuffs
    that.DOMElement.style.alignItems = 'baseline';
    that.DOMElement.style.justifyContent = 'flex-start';
    */
    that.DOMElement.style.display = "grid";


    // placeholder message
    let bs = document.createElement('h1');
    bs.style.width="max-content";
    bs.textContent = `${that._className} v${that._version} | work in progress`
    that.testNote = bs;

    // lets make a few pie charts for the helluvit
    this.pie = new noicePieChart({
        showPieChart: true,
        size: '4em',
        pieCharts: [
            { name: 'done', fill:'rgba(191, 191, 24, .66)' },
            { name: 'loading', fill:'rgba(6, 133, 135, .66)' }
        ],
        zIndex: 1
    }).append(that._DOMElements.chartContainer);
    this.pie.updatePieChart('done', 35);

    /*
        LOH 10/9/23 @ 1726
        if you wanted to say ... build a new gfx module you might wanna
        use this little spot as a test harness eh?
        nudge nudge
        wink wink
        knowwhatimean?
    */
    this.bar = new noiceBarChart({
        width: '8em',
        height: '6em',
        zIndex: 1
    }).append(that._DOMElements.chartContainer);

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
export { testUIOne };
