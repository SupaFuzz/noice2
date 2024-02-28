/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { noicePieChart } from '../../../lib/noicePieChart.js';
import { noiceScannerInput } from '../../../lib/noiceScannerInput.js';

class testUIFour extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'testUIThree',
            pies: {},
            debug: false,
            _isTyping:              false,
            isTypingCheckInterval:  150,   // 100 == 10 times a second
            isTypingTimeout:        500,   // half a second
            scanIndicatorTimeout:   (1000 * 30), // 30 seconds
            _shiftFlag:             false,
            _scanBuffer:            [],
            _found:                 [],
            scanListener:           null,
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <div class="chartContainer" data-templatename="chartContainer" data-templateattribute="true"></div>
    <div class="scanCage" data-templatename="scanCage" data-templateattribute="true" style="color: rgb(240, 240, 240);display:grid;"></div>
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

    that.scanningPie = new noicePieChart({
        showPieChart: true,
        size: '1.25em',
        pieCharts: [
            { name: 'found', fill:'rgba(0, 153, 0, .75)', stroke:'rgba(0, 153, 0, 1)', strokeWidth:'2px'},
            { name: 'searching', fill:'rgba(190, 57, 57, .66)', stroke:'rgba(180, 57, 57, 1)', strokeWidth:'2px'}
        ],
        zIndex: 1,
        animationCallback:  function(selfRef){
            selfRef.updatePieChart('searching', (((selfRef._animationFrame%200)/200)*100));
        },
        animationStartCallback: function(selfRef){
            selfRef.showPieChart = true;
            selfRef.updatePieChart('searching', 0);
        },
        animationExitCallback: function(selfRef){
            window.requestAnimationFrame(function(){
                selfRef.showPieChart = false;
                selfRef.updatePieChart('searching', 0);
            });
        }
    }).append(that._DOMElements.chartContainer);

    this.scannerInput = new noiceScannerInput({
        tagReceiveCallback: (tagString, slf) => { that.handleTagFromScanner(tagString); },
        scanStartCallback: (slf) => { that.scanStartHandler(slf); },
        scanEndCallback: (tagArray, slf) => { that.scanEndHandler(tagArray, slf); }
    })

}




/*
    scanStartHandler(scannerInputRef)
*/
scanStartHandler(scannerInputRef){
    this._DOMElements.scanCage.innerHTML = '';
    if (this.scanningPie){ this.scanningPie.runAnimation = true; }
}




/*
    scanEndHandler(tagArray, scannerInputRef)
*/
scanEndHandler(tagArray, scannerInputRef){
    console.log(tagArray);
    if (this.scanningPie){ this.scanningPie.runAnimation = false; }
}






/*
    handleScanStreamTerminate(tagStringArray)
    the isTypingTimeout has expired and so we presume the scanner has
    terminated the datastream. tagStringArray is a *copy* of that._found
    this should be an accumulation of everything received by handleTagFromScanner()
*/
handleScanStreamTerminate(tagStringArray){
    let that = this;
    window.requestAnimationFrame(function(){
        if (that.debug){ that._app.log(`${that._className} v${that._version} | handleScanStreamTerminate() | called with ${tagStringArray.length} items`); }

        console.log(tagStringArray);
    });
}




/*
    handleTagFromScanner(tagString)
    this is the data stream from the scanner
    aggregated by \n, so we should receive one tagNumber at a
    time here. This should be async on animationFrames
*/
handleTagFromScanner(tagString){
    let that = this;
    window.requestAnimationFrame(function(){
        if (that.debug){ that._app.log(`${that._className} v${that._version} | handleTagFromScanner(${tagString})`); }
        if (that.isNotNull(tagString)){
            let span = document.createElement('span');
            span.className = "tagNumber";
            span.textContent = tagString;
            that._DOMElements.scanCage.appendChild(span);
        }
    });
}




/*
    gainFocus()
    the UI is gaining focus from a previously unfocused state
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){

        that.scannerInput.enableListener = true;

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

        that.scannerInput.enableListener = false;

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




}
export { testUIFour };
