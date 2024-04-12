/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcPieChart } from '../../../lib/webComponents/wcPieChart.js';
wcPieChart.registerElement('wc-pie-chart');

class webComponentDemo extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'webComponentDemo',
            debug: false,
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <h1>Web Component Demo</h1>

    <div class="pieChartDemo" style="display:grid;place-items:center;">
        <wc-pie-chart id="testMe" size="20em" badge_text="test" show_badge="true" badge_position="bottom"></wc-pie-chart>
        &nbsp;
        &nbsp;
        <button id="btnAddChart">add charts</button>
        <button id="btnToggleMode">layout mode</button>
    </div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;
    that.DOMElement.style.display = "grid";

    that.testPie = that.DOMElement.querySelector('#testMe');

    that.DOMElement.querySelector('#btnAddChart').addEventListener('click', (evt) =>{
        // I ain't fibbin' ... or am i?
        [2, 3 ,34, 8, 13, 5, 1, 21 ].forEach((fn) => {
            that.testPie.addChart({name: `L${fn}`, value: fn, chart_color: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, .8)` });
        });
    });

    that.DOMElement.querySelector('#btnToggleMode').addEventListener('click', (evt) =>{
        that.testPie.multiple_chart_mode = (that.testPie.multiple_chart_mode == "stack")?'overlay':'stack';
        that.testPie.badge_text = `chart layout: ${that.testPie.multiple_chart_mode}`;
    });

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
export { webComponentDemo };
