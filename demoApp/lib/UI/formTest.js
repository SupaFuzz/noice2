/*
    formTest.js
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcARSFormView } from '../../../lib/webComponents/wcARSFormView.js';
import { demoForm, demoRow } from '../../config/demoForm.js';

/*
import { wcSplitter } from '../../../lib/webComponents/wcSplitter.js';
import { wcTable } from '../../../lib/webComponents/wcTable.js';
*/

class formTest extends noiceCoreUIScreen {


/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'formTest',
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
get html(){return(`
    <div data-templatename="buttonContainer" data-templateattribute="true">
        <button data-templatename="btnMake" data-templateattribute="true">Make FormView</button>
        <button data-templatename="btnNarrow" data-templateattribute="true" disabled>Make Narrow</button>
    </div>
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
    that.DOMElement.style.gridTemplateRows = '2em auto';

    that._DOMElements.btnMake.addEventListener('click', (evt) => {

        // make wcARSFormView here
        that.formView = new wcARSFormView({
            debug: true,
            rowData: demoRow,
            fieldConfig: demoForm,
            mode: 'modify',
            show_modified_field_indicator: true,
            height: '75vh',
            viewClosedCallback: (slf) => {
                that._DOMElements.btnMake.disabled = false;
                that._DOMElements.btnNarrow.disabled = true;
                that._DOMElements.btnNarrow.textContent = "Make Narrow"
            }
        });

        that.formView.renderFieldContainer = (fieldContainerElement) => {
            let dis = that.formView;
            dis.manageFormElements();

            /*
                TO-DO: insert shenanigans here
            */
            fieldContainerElement.innerHTML = '';

            /*
                this should get moved to a sublcass like wcNSCANFormView or something
                for the moment hard coding it because we have so much else left to work
                on here before we get to subclasses. But when we do move this to the
                new child class and then uncomment the dumb demo one below
            */
            ['shipping', 'receiving', 'tags and identification', 'location', 'assignment', 'item information' ,'etc.'].forEach((sectionTitle) => {
                let fs = document.createElement('fieldset');
                fs.dataset.name = sectionTitle;
                let legend = document.createElement('legend');
                legend.textContent = sectionTitle;
                fs.appendChild(legend);
                Object.keys(dis.fieldConfig).map((a)=>{return(dis.fieldConfig[a])}).filter((conf) => {return(
                    (conf instanceof Object) &&
                    (conf.hasOwnProperty('displaySection')) &&
                    (conf.displaySection == sectionTitle) &&
                    (conf.hasOwnProperty('displayOrder')) &&
                    (! isNaN(parseFloat(conf.displayOrder))) &&
                    dis.formElements.hasOwnProperty(conf.fieldName)
                )}).sort((a,b) => {return(a.displayOrder - b.displayOrder)}).forEach((conf) => {
                    fs.appendChild(dis.formElements[conf.fieldName]);
                });

                // the "add as new location" thing for location
                if (sectionTitle == "location"){
                    let that = this;
                    let d = document.createElement('div');
                    d.className = "btnContainer";
                    dis._elements.btnAddLocation = document.createElement('button');
                    dis._elements.btnAddLocation.dataset._name = "btnAddLocation";
                    dis._elements.btnAddLocation.disabled = true;
                    dis._elements.btnAddLocation.textContent = 'add as new location';
                    dis._elements.btnAddLocation.addEventListener('click', (evt) => {
                        // fire the "add_location" event and let the parent noiceARSRow handle it
                        that.dispatchEvent(new CustomEvent("add_location", { detail: {
                            value: {
                                center: dis.formElements.Center.value,
                                building: dis.formElements.Building.value,
                                room: dis.formElements.Room.value,
                                binRack: dis.formElements['Bin/Rack'].value
                            },
                            self: dis
                        }}));
                    });
                    d.appendChild(dis._elements.btnAddLocation);
                    fs.appendChild(d);
                }

                fieldContainerElement.appendChild(fs);
            });
        };

        that._DOMElements.btnMake.disabled = true;
        that.DOMElement.appendChild(that.formView);
        that._DOMElements.btnNarrow.disabled = false;
    });

    that._DOMElements.btnNarrow.addEventListener('click', (evt) => {
        that._DOMElements.btnNarrow.textContent = (that._DOMElements.btnNarrow.textContent == "Make Narrow")?"Make Wide":"Make Narrow";
        that.formView.narrow = (!(that._DOMElements.btnNarrow.textContent == "Make Narrow"));
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
export { formTest };
