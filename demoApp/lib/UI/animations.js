/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcPieChart } from '../../../lib/webComponents/wcPieChart.js';
import { noiceRadialPolygonPath } from '../../../lib/noiceRadialPolygonPath.js'

/*
import { wcSplitter } from '../../../lib/webComponents/wcSplitter.js';
import { wcTable } from '../../../lib/webComponents/wcTable.js';
*/

class animationTest extends noiceCoreUIScreen {


/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'animationTest',
            debug: false,
            themeStyle: null,
            runAnimation: false
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){
    return(`
        <div class="eh" style="
            height: 100%;
            width: 100%;
            overflow: hidden;
            display: grid;
            grid-template-columns: auto auto;
            align-items: center;
        ">
            <wc-pie-chart size="20em" style="justify-self: right;" data-templatename="pieChart" data-templateattribute="true"></wc-pie-chart>
            <div class="btnContiner" style="justify-self: left;" data-templatename="btnContainer" data-templateattribute="true">
                <button data-templatename="btnStart" data-templateattribute="true">start</button>
            </div>
        </div>
    `);
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){


    // a bit cheeky I must say
    let that = this;
    this._DOMElements.pieChart.initializedCallback = () => {

        // this is the actual radius btw
        let radius = (that._DOMElements.pieChart.chart_size/2) * (7/8);
        // hold my beer
        that.path = new noiceRadialPolygonPath({
            edges: 2,
            phase: 0,
            phaseReverse: true,
            stroke: 'red',
            strokeWidth: '2px',
            radius: radius *.8,
            useArc: true
        });

        that.path.append(that._DOMElements.pieChart.svgDOMObject);

        that._DOMElements.btnStart.addEventListener('click', () => {
            that.runAnimation = (! (that.runAnimation == true));
            if (that.runAnimation == true){ that.startAnimation(); }
            that._DOMElements.btnStart.textContent = (that.runAnimation == true)?'stop':'start';
        });
    }

}

startAnimation(){
    this.runAnimation = true;
    let that = this;
    function animate(lastTimestamp){
        let timestamp = (new Date() * 1);
        let delta = (timestamp - isNaN(parseFloat(lastTimestamp))?timestamp:lastTimestamp);
        let duration = 2500; // one second I think?
        that.path.phase = Math.PI * 2 * ((duration - (delta%duration))/duration);
        if (that.runAnimation){
            requestAnimationFrame(() => { animate(timestamp); });
        }
    }
    animate();
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
export { animationTest };
