/*
    customScreenExample.js
    demonstrates how to extend wcScreen.js for a full-fledged ui component

    NOTE: oh lort. the amount of boilerplate needed in webComponent subclasses
    is freakin' annoying. maybe think of something better someday but for now ...

*/
import { wcScreen } from '../../lib/webComponents/wcScreen.js';
class customScreenExample extends wcScreen {




static classID = customScreenExample;
static classAttributeDefaults = {
    // needed boilerplate (it is what it is)
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    has_focus: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    fit_parent: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    name: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_label: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_order: { observed: true, accessor: true, type: 'float', value: '0', forceAttribute: true, forceInit: true }

    // add custom element attributes here if needed
};

// also boilerplate
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(args){
    // boilerplate
    super(args);
    this._className = 'customScreenExample';    // change me
    this._version = 1;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        // more boilerplate
        name: (a,o,n,s) => { s.setName(n); },
        menu_label: (a,o,n,s) => { s.setMenuLabel(n); },
        menu_order: (a,o,n,s) => { s.setMenuOrder(n); },

        /*
            put your custom attribute change handlers here
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };

    // merge object defaults
    this.mergeClassDefaults({
        // boilerplate
        _content: null,
        _menu_icon_mask: null

        // put custom attribute defaults here
    });

    // hackarooni
    this.setContent();
    this.setStyleSheet();
    //this.setInitCallback();

}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way

    also  boilerplate just be sure to replace the class name symbo
*/
getAttributeDefaults(){ return(customScreenExample.classAttributeDefaults); }
getStyleDefaults(){ return(customScreenExample.classStyleDefaults); }




/*
    ------------------------------------------------------------
    custom stuffs
    ------------------------------------------------------------
*/




/*
    content setter
*/
setContent(){
    this.content = `
        <!-- html content goes here -->
        <div class="container">
            <div class="header">
                <h2 class="title">The Lorem</h2>
                <div class="buttonContainer">
                    <button>Sit</button>
                    <button>Dolor</button>
                    <button>Ipsum</button>
                </div>
            </div>
            <div class="main">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ornare, lectus vitae aliquam rhoncus, ipsum elit consequat dui, sed rhoncus ante ante id nisi. Sed a arcu sit amet dolor pulvinar lacinia vel sed dui. Duis sit amet varius risus. Donec luctus ultricies dui quis posuere. Phasellus a eros fermentum orci sodales posuere in in magna. Suspendisse sit amet massa eros. Nam lacus leo, dapibus a nibh vitae, scelerisque accumsan nisi. Curabitur accumsan arcu eu semper pulvinar. Duis diam ante, dictum vitae feugiat sit amet, volutpat quis sem. Quisque laoreet suscipit interdum. Nunc nulla tortor, egestas et ultrices nec, porta quis ligula. Nullam rhoncus, quam nec semper viverra, ante quam interdum erat, vel malesuada magna sapien sed eros. Cras placerat nisl nisl, vel efficitur nisl placerat eu.</p>

                <p>Curabitur dictum congue interdum. Curabitur orci magna, scelerisque vel pulvinar eu, hendrerit vel ex. Phasellus vulputate sem orci, maximus placerat nunc auctor vitae. Suspendisse pellentesque imperdiet libero ac dapibus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin ullamcorper eros quis nunc ultrices, vel euismod odio interdum. Nam velit sem, porta et ex quis, dignissim volutpat justo. Sed quis efficitur augue. Vestibulum sed elit et metus laoreet maximus. Proin luctus, ipsum et ultricies malesuada, sapien eros tincidunt sapien, nec vulputate nibh lorem nec leo. In nec ligula felis. Cras tortor ligula, commodo posuere sagittis sit amet, imperdiet ut magna. Donec quis volutpat neque. Proin congue eget mi quis egestas.</p>

                <p>In odio eros, pulvinar eu nisl eget, pulvinar rutrum mauris. Nam eget purus odio. In venenatis risus sed ipsum porta, ac suscipit ex interdum. Cras molestie scelerisque malesuada. Curabitur sagittis magna sit amet condimentum feugiat. Integer volutpat vulputate libero, quis blandit orci efficitur nec. Phasellus a turpis vel mauris rhoncus congue non et nunc. Vivamus lectus orci, dictum et ullamcorper a, ultricies quis ipsum. Nulla facilisi. Curabitur eu maximus ligula. Mauris ut venenatis nunc, sed molestie nisl. Vivamus tincidunt tellus quis scelerisque molestie. Sed vulputate suscipit purus nec venenatis.</p>

                <p>Nam at finibus nisl, in rutrum tortor. Sed varius vitae turpis feugiat fermentum. Quisque vulputate id massa at malesuada. Curabitur vestibulum lectus a sapien cursus, a elementum ipsum facilisis. Proin dapibus semper interdum. Sed fermentum nisl sed elit tempus, id malesuada enim pretium. Praesent bibendum eu mauris vel convallis. Integer condimentum est justo, sed egestas libero molestie a.</p>

                <p>Phasellus vitae est nec ex ultrices eleifend. In fringilla non lectus eu interdum. Integer eget diam gravida, faucibus ante vitae, suscipit purus. Quisque volutpat gravida metus ut interdum. Etiam fringilla laoreet ex, sit amet luctus quam ultrices eget. Integer imperdiet, felis sit amet ultricies imperdiet, sapien ligula cursus mi, sed fermentum lorem nulla quis massa. Curabitur tempus quam libero, sit amet euismod dui facilisis ornare. Sed non sem ac augue lacinia porta. Integer erat arcu, ultrices at odio at, auctor dapibus erat. Aliquam erat volutpat. Ut vitae molestie tellus, eget accumsan nulla. Quisque fermentum dui eget sapien tincidunt, non tincidunt lacus fringilla. Aenean a mauris euismod, varius sem et, accumsan quam. Praesent eleifend bibendum tellus id cursus. Fusce congue laoreet pulvinar.</p>

                <p>Aliquam ex nunc, vehicula sed porttitor a, consequat ac est. Sed sed sapien suscipit elit scelerisque molestie. Phasellus id dui consequat, varius enim quis, dapibus sapien. In ut pulvinar est. Aenean euismod, nunc eget iaculis mattis, tortor lorem luctus ex, at auctor orci nibh vitae felis. Duis ac diam pretium, interdum tellus semper, pharetra neque. Pellentesque vel porta ipsum, vulputate congue justo. Nunc sagittis neque diam, vel suscipit erat tincidunt vel. In euismod augue nec convallis iaculis.</p>

                <p>Proin venenatis porta nisi. Suspendisse sit amet sapien convallis, malesuada urna vel, venenatis metus. Ut hendrerit nibh ac maximus facilisis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque tincidunt bibendum luctus. Suspendisse ut condimentum quam, ac mattis ligula. Fusce sit amet finibus purus, sit amet dignissim nibh. Nam tincidunt mauris vel felis congue pharetra. Proin et sem nec nulla efficitur rhoncus. Nulla sodales feugiat lorem eget convallis. Cras efficitur a odio vel porttitor. Cras consequat, orci in semper suscipit, turpis lectus vulputate nunc, ut interdum odio mi vitae nisi.</p>

                <p>Vestibulum felis purus, eleifend at porttitor ut, egestas non libero. Quisque sapien lectus, ullamcorper convallis sem ac, egestas volutpat libero. Etiam malesuada malesuada posuere. Ut laoreet varius odio, nec volutpat nisi auctor et. Aenean sed urna ac lectus porttitor finibus sit amet at arcu. Proin ornare viverra urna sed sollicitudin. Aliquam erat volutpat. Morbi non enim ac augue luctus ullamcorper. Integer viverra metus a turpis iaculis, vel egestas sapien pharetra. Maecenas accumsan mauris congue porta vehicula. Donec at odio vitae nunc luctus consequat. Mauris fringilla viverra justo et facilisis. In vel felis ex.</p>
            </div>
        </div>
    `;
}



/*
    stylesheet setter
*/
setStyleSheet(){
    this.styleSheet = `
        /* css content goes here */
        .container .header {
          display: grid;
          grid-template-columns: auto auto;
          align-items: center;
        }
        .container .header .buttonContainer {
          display: flex;
          flex-direction: row-reverse;
        }
        .container .header .buttonContainer button {
          margin-right: .5em;
        }

    `;
}

/*
    LOH 6/2/25 @ 1038 -- I'm tired of messing with this
    I'm gonna go work on the Form-100 approvals thing in ARS for a while
    CSS is such a pain in the arse.

    the problem is, once again, making .container .main respect the parent
    dimensions and draw a scrollbar on .main (not :host, not .container, not document)
    when the content overflows the viewport.

    this should not still be such a royal pain in the year 2025.
    ugh.

    oh and also the custom icon thing won't work from markup but does from js because
    well ... hell if I know. document.createElement does things wierd and there's some
    deets there I don't understand I guess. It's like the custom attributes don't actually
    exist until the markup parser actually inserts the thing into a visible DOM
    (no a DocumentFragment doesn't goose it apparently). Like it actually doesn't fully
    instantiate the object hence the object has no properties. Why it gotta be like this?!

    anyhow I'm gonna go work on something else for a while before I pull my hair out.
*/


/*
    initializedCallback setter
*/
initializedCallback(slf){
    // do thine one-time setups here
    // console.log("I'm here");
};



/*
    gainFocusCallback
*/
gainFocusCallback(focusArgs, slf){
    let that = this;
    return(new Promise((toot, boot) => {
        /*
            toot(slf) (or that) to proceed
            boot(error) to abort focus change
        */
        toot(that);
    }));
}




/*
    loseFocusCallback
*/
loseFocusCallback(focusArgs, slf){
    let that = this;
    return(new Promise((toot, boot) => {
        /*
            toot(slf) (or that) to proceed
            boot(error) to abort focus change
        */
        toot(that);
    }));
}




/*
    custom menu icon
*/
get menu_icon_mask(){ return(`url('data:image/svg+xml;utf8,${this.warningIcon}')`); }




/*
    warningIcon
*/
get warningIcon(){return(encodeURIComponent(`<svg
    version="1.1"
    id="Capa_1"
    x="0px"
    y="0px"
    viewBox="0 0 486.463 486.463"
    style="enable-background:new 0 0 486.463 486.463;"
    xml:space="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg"><defs
    id="defs45" />
 <g
    id="g10"
    style="stroke:none;fill:#000000;fill-opacity:1">
 	<g
    fill="#E600A1"
    stroke="#595959"
    id="g8"
    style="stroke:none;fill:#000000;fill-opacity:1">
 		<path
    d="M243.225,333.382c-13.6,0-25,11.4-25,25s11.4,25,25,25c13.1,0,25-11.4,24.4-24.4    C268.225,344.682,256.925,333.382,243.225,333.382z"
    id="path2"
    style="stroke:none;fill:#000000;fill-opacity:1" />
 		<path
    d="M474.625,421.982c15.7-27.1,15.8-59.4,0.2-86.4l-156.6-271.2c-15.5-27.3-43.5-43.5-74.9-43.5s-59.4,16.3-74.9,43.4    l-156.8,271.5c-15.6,27.3-15.5,59.8,0.3,86.9c15.6,26.8,43.5,42.9,74.7,42.9h312.8    C430.725,465.582,458.825,449.282,474.625,421.982z M440.625,402.382c-8.7,15-24.1,23.9-41.3,23.9h-312.8    c-17,0-32.3-8.7-40.8-23.4c-8.6-14.9-8.7-32.7-0.1-47.7l156.8-271.4c8.5-14.9,23.7-23.7,40.9-23.7c17.1,0,32.4,8.9,40.9,23.8    l156.7,271.4C449.325,369.882,449.225,387.482,440.625,402.382z"
    id="path4"
    style="stroke:none;fill:#000000;fill-opacity:1" />
 		<path
    d="M237.025,157.882c-11.9,3.4-19.3,14.2-19.3,27.3c0.6,7.9,1.1,15.9,1.7,23.8c1.7,30.1,3.4,59.6,5.1,89.7    c0.6,10.2,8.5,17.6,18.7,17.6c10.2,0,18.2-7.9,18.7-18.2c0-6.2,0-11.9,0.6-18.2c1.1-19.3,2.3-38.6,3.4-57.9    c0.6-12.5,1.7-25,2.3-37.5c0-4.5-0.6-8.5-2.3-12.5C260.825,160.782,248.925,155.082,237.025,157.882z"
    id="path6"
    style="stroke:none;fill:#000000;fill-opacity:1" />
 	</g>
 </g>
 <g
    id="g12">
 </g>
 <g
    id="g14">
 </g>
 <g
    id="g16">
 </g>
 <g
    id="g18">
 </g>
 <g
    id="g20">
 </g>
 <g
    id="g22">
 </g>
 <g
    id="g24">
 </g>
 <g
    id="g26">
 </g>
 <g
    id="g28">
 </g>
 <g
    id="g30">
 </g>
 <g
    id="g32">
 </g>
 <g
    id="g34">
 </g>
 <g
    id="g36">
 </g>
 <g
    id="g38">
 </g>
 <g
    id="g40">
 </g>
</svg>`))}



}

// more boilerplate, replace the registerElement string and the className
const _classRegistration = customScreenExample.registerElement('custom-screen-example');
export { _classRegistration as customScreenExample };
