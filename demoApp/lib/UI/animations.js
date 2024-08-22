/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcPieChart } from '../../../lib/webComponents/wcPieChart.js';
import { noiceRadialPolygonPath } from '../../../lib/noiceRadialPolygonPath.js'

import { wcScanIndicator } from '../../../lib/webComponents/wcScanIndicator.js';
import { wcSelectableObject } from '../../../lib/webComponents/wcSelectableObject.js'

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
            align-items: baseline;
        ">
            <wc-pie-chart size="10em" style="justify-self: right;" data-templatename="pieChart" data-templateattribute="true"></wc-pie-chart>
            <div class="btnContiner" style="justify-self: left;" data-templatename="btnContainer" data-templateattribute="true">
                <button data-templatename="btnStart" data-templateattribute="true">start</button>
            </div>
            <wc-scan-indicator size="5em" style="justify-self: right;" data-templatename="scanInd" data-templateattribute="true"></wc-scan-indicator>
            <div class="btnContiner" style="justify-self: left;" data-templatename="btnContainer2" data-templateattribute="true">
                <button data-templatename="btnStart2" data-templateattribute="true">start</button>
            </div>

            <wc-scan-indicator size="5em" style="justify-self: right;" data-templatename="scanInd2" data-templateattribute="true"></wc-scan-indicator>

            <wc-selectable-object selected="false" data-templatename="obj" data-templateattribute="true">
                <ul slot="thang" class="test">
                    <li>this</li>
                    <li>is</li>
                    <li>a</li>
                    <li>test</li>
                </ul>
            </wc-selectable-object>

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

        that._DOMElements.btnStart2.addEventListener('click', () => {
            that._DOMElements.scanInd.run_animation = (that._DOMElements.btnStart2.textContent == 'start');
            that._DOMElements.btnStart2.textContent = (that._DOMElements.btnStart2.textContent == 'start')?'stop':'start';
        });

        // selectable object stuff
        /*
        var bs = document.createElement("ul");
        ['one', 'two', 'three'].forEach((a) => {
            let c = document.createElement('li');
            c.textContent = a;
            bs.appendChild(c);
        });
        that._DOMElements.obj.content = bs;0
        */
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
