/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcSplitter } from '../../../lib/webComponents/wcSplitter.js';
wcSplitter.registerElement('wc-splitter');

class layoutTest extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'layoutTest',
            debug: false,
            themeStyle: null
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){
return(`<wc-splitter orientation="horizontal"></wc-splitter>`);

/*
return(`
    <div class="horizontalSplitter" data-templatename="horizontalSplitter" data-templateattribute="true">
        <div class="upper section" data-templatename="upperSection" data-templateattribute="true"></div>
        <div class="lower section" data-templatename="lowerSection" data-templateattribute="true"></div>
    </div>
`)
*/
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    /*
    let that = this;

    // lessee if we can make a clickHandler that ONLY fires on the background
    that.DOMElement.querySelectorAll('.section').forEach((el) => {
        el.addEventListener("mousedown", (evt) => { evt.stopPropagation(); });
        //el.addEventListener("mouseup", (evt) => { evt.stopPropagation(); });
    });

    that._DOMElements.horizontalSplitter.addEventListener("mousedown", (evt) => {
        that._dragStart = [
            evt.clientX,
            evt.clientY,
            that._DOMElements.upperSection.offsetHeight,
            that._DOMElements.lowerSection.offsetHeight,
            (that._DOMElements.upperSection.offsetHeight/(that._DOMElements.upperSection.offsetHeight + that._DOMElements.lowerSection.offsetHeight)),
            (that._DOMElements.lowerSection.offsetHeight/(that._DOMElements.upperSection.offsetHeight + that._DOMElements.lowerSection.offsetHeight)),

        ];
        console.log(`horizontalSplitter grabbed`, that._dragStart);
        that._dragListener = that.getEventListenerWrapper((evt, slf) => { slf.handleDrag(evt, slf); });
        that._DOMElements.horizontalSplitter.addEventListener('mousemove', that._dragListener);
    });

    that._DOMElements.horizontalSplitter.addEventListener("mouseup", (evt) => {
        console.log(`horizontalSplitter released`);
        if (that._dragListener instanceof Function){
            that._DOMElements.horizontalSplitter.removeEventListener('mousemove', that._dragListener);
        }
    });

        LOH 5/29/24 @ 2301
        it works! really smoothly too!

        next step -- componentize it
        conidder something like splitter
        with orientation="horisontal" | "vertical"

        may need to change pane naming conventions
        something for tomorrow
    */
    this.splitter = this.DOMElement.querySelector('wc-splitter');

    this.splitter.a =
`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus in est sem. Praesent nec convallis neque. Cras ultrices tristique felis, in accumsan diam rhoncus ultrices. Mauris sit amet nibh ac quam malesuada pulvinar. Quisque et porta massa. In hac habitasse platea dictumst. Sed id gravida mi. Nulla vel lacinia purus, at laoreet sapien. Nulla nec pulvinar lorem. Donec vel eleifend quam, a consectetur tellus. Mauris quis metus odio. Maecenas velit est, molestie ac porttitor eu, placerat porttitor est. Praesent pharetra sodales tellus vitae condimentum. Aliquam erat volutpat. Sed vel gravida nisl, eu fermentum augue. Sed eu mattis turpis.

Duis quis lectus ut neque facilisis porta. Nulla eu diam a purus interdum tempus et at diam. In porttitor, erat eget aliquet faucibus, orci augue viverra tortor, et suscipit ante quam eget purus. In pharetra augue dictum aliquet posuere. Suspendisse luctus aliquet augue, nec convallis neque iaculis id. Vestibulum volutpat vulputate porttitor. Cras auctor nisi in porta sodales. Vestibulum in tempor turpis. Aliquam erat volutpat. In velit libero, pharetra sed tincidunt ut, venenatis a mi. Nam mi quam, tincidunt vitae hendrerit vitae, maximus non elit. Proin in tempus velit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec libero nibh, laoreet eu nulla at, mattis rutrum tellus. Sed vestibulum pretium convallis.

Sed aliquam pulvinar lacus posuere facilisis. Donec sapien dolor, luctus ac malesuada efficitur, pharetra ornare purus. Duis id eleifend sapien, vitae ultricies dolor. Nullam vel nisi ipsum. Integer ac tortor vel est bibendum vehicula id a leo. Aliquam sapien ante, tempus nec vehicula nec, egestas non urna. Fusce pretium tincidunt tellus nec molestie.

Morbi ut luctus purus. Aenean gravida molestie est ac suscipit. Nunc rutrum, elit eu molestie elementum, ligula velit vestibulum diam, ut facilisis ligula magna et orci. Cras efficitur placerat neque, nec sollicitudin tellus egestas et. Phasellus condimentum orci at posuere vestibulum. Suspendisse et euismod lectus. Sed volutpat est vitae tellus malesuada, condimentum pretium mauris aliquam. Cras convallis, sapien quis consequat rutrum, dolor elit blandit metus, ut hendrerit justo orci ut erat.

Mauris blandit maximus erat. Suspendisse potenti. Mauris dapibus tristique bibendum. Nulla a efficitur elit. Etiam varius porta consequat. Interdum et malesuada fames ac ante ipsum primis in faucibus. In hac habitasse platea dictumst. Nam laoreet pharetra enim, id imperdiet eros tincidunt eget. Fusce odio ante, pellentesque eget vestibulum dignissim, gravida lobortis massa. Duis ultricies sed ipsum eu condimentum. Etiam ornare lectus vel lacus finibus porttitor. Duis semper mauris magna, vehicula vestibulum lorem semper iaculis. Nunc placerat, erat nec dictum accumsan, ante arcu efficitur libero, et malesuada eros neque eu ipsum. Nunc laoreet sagittis magna vitae sollicitudin. Donec commodo fringilla ipsum quis pharetra.`

    this.splitter.b = this.splitter.a;


}
/*
    handleDrag(evt, slf)
*/
handleDrag(evt, slf){
    let deltaY = (evt.clientY - this._dragStart[1]);
    let deltaYPct = deltaY / (this._dragStart[2] + this._dragStart[3]);
    this._DOMElements.horizontalSplitter.style.gridTemplateRows = `${(this._dragStart[4] + deltaYPct)*100}% ${((this._dragStart[4] + this._dragStart[5]) - (this._dragStart[4] + deltaYPct))*100}%`;
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
export { layoutTest };
