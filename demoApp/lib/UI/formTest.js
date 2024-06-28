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
            height: '75vh'
        });
        that._DOMElements.btnMake.disabled = true;
        that.DOMElement.appendChild(that.formView);

        /*
        new noiceARSRow({
            formName: this._DOMElements.schema.value,
            threadClient: that._app.arsSyncWorkerClient,
            auxFieldConfig: (that._DOMElements.schema.value == 'NPAM:NSCAN2:TrackingNumberRegistry')?trackingNumberFormDisplayProperties:fieldDisplayProperties,
            debug: false
        }).load(that._DOMElements.entryID.value).then((row) => {
            that.testARSRow = row;
            that.testFormView = row.getFormView({
                height: (that._DOMElements.schema.value == 'NPAM:NSCAN2:TrackingNumberRegistry')?'min-content':'70vh'
            }, (that._DOMElements.schema.value == 'NPAM:NSCAN2:TrackingNumberRegistry')?wcTrackingNumberFormView:'');
            that._DOMElements.frmCntr.innerHTML = '';
            that._DOMElements.frmCntr.appendChild(that.testFormView);
        });
        */


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
