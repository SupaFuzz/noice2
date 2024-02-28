/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { noicePieChart } from '../../../lib/noicePieChart.js';

class testUIThree extends noiceCoreUIScreen {




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

}




/*
    scanHandler(keyPressEvent)

    hook this up to a keydown listener on document.body
    if the body has focus, we receive the keystrokes
    modify to taste
*/
scanHandler(kpevt){
    let that = this;

    if (document.activeElement.tagName == "BODY"){
        that.lastKeyPress = that.epochTimestamp(true);
        that.isTyping = true;

        if (kpevt.code == "Enter"){
            that._found.push(that._scanBuffer.join(''));
            that._scanBuffer = [];

            /*
                in this block, we have received the \n from the scanner
                meaning we've got a complete tag and have pushed it onto
                _scanBuffer. If you want to do something immediately with
                the last tag found it's on

                that._found[(that._found.length -1)]
            */
            that.handleTagFromScanner(that._found[(that._found.length -1)]);

        }else if (kpevt.key == "Shift"){
            that._shiftFlag = true;
        }else{
            that._scanBuffer.push(that._shiftFlag?kpevt.key.toUpperCase():kpevt.key);
            if (that._shiftFlag == true){ that._shiftFlag = false; }
        }
    } // don't fire if anything has focus (classy move!)

    // handy debug statements
    // console.log(document.activeElement.tagName);
    // console.log(`[main] ${kpevt.code} -> ${kpevt.key}`);
}




// isTyping getter and setter
get isTyping(){ return(this._isTyping); }
set isTyping(v){
    let that = this;
    let b = (v == true);

    // seting true from false, setup the timer to check the timeout
    if ((! this._isTyping) && (b == true)){
        that._DOMElements.scanCage.innerHTML = ''; // clear out previous scan results
        that.isTypingTimer = setInterval(function(){
            if ((that.lastKeyPress > 0) && ((that.epochTimestamp(true) - that.lastKeyPress) > that.isTypingTimeout)){
                clearInterval(that.isTypingTimer);
                that.isTyping = false;
            }
        }, that.isTypingCheckInterval);

    // setting false from true, clear _found
    }else if ((this._isTyping == true) && (b == false)){

        // note if you wanted to add some sort of "here's what I got, deal with it" callback, this is the place
        window.requestAnimationFrame(function(){
            if (! that.isTyping){

                // reset the scanning animation
                that.scanningPie.updatePieChart('found', 0);
                that.scanningPie.showPieChart = false;

                // remove me
                //console.log('done scanning, deal with it: ', that._found);
                that.handleScanStreamTerminate(that._found.slice());

                // reset the found tag buffer (so if you doin something be sure to *clone* this array not just pass a pointer)
                that._found = [];
            }
        }, that.scanIndicatorTimeout);
    }

    // set the value
    this._isTyping = b;

    /*
        toggle an animation based on _isTyping here
        for instance something like:
    */
    if (this.scanningPie){ this.scanningPie.runAnimation = this._isTyping; }

    // the entire UI is locked when the scanner is sending data
    that.locked = that._isTyping;
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

        // bind the scanHandler to keydown event
        that.scanListener = that.getEventListenerWrapper(function(evt, sr){ that.scanHandler(evt); });
        document.addEventListener('keydown', that.scanListener);

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

        // unbind the scanHandler from the keydown event
        if (that.scanListener instanceof Function){
            document.removeEventListener('keydown', that.scanListener);
            that.scanListener = null;
        }

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}

}
export { testUIThree };
