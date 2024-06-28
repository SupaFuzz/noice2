/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';

import { wcPieChart } from '../../../lib/webComponents/wcPieChart.js';
wcPieChart.registerElement('wc-pie-chart');

import { wcFormElement } from '../../../lib/webComponents/wcFormElement.js';
wcFormElement.registerElement('wc-form-element');

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
            themeStyle: null
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){
    let bs = JSON.stringify({
      Cats: [
        "Bootsy",
        "Meowery",
        "Moe",
        [3, "Lilly"],
        "Jazzy",
        "Lucy"
      ],
      Dogs: [
        "Scotty",
        "Missy",
        "Molly",
        "Grizzly"
      ]
    });
return(`
    <h1>Web Component Demo</h1>


    <div class="pieChartDemo" style="
        display:grid;
        place-items:center;
        grid-template-columns: auto auto;
        margin-bottom: 2em;
    ">
        <wc-pie-chart id="testMe" size="12em" badge_text="test" show_badge="true" badge_position="bottom"></wc-pie-chart>
        <div class="btnContainer" style="
            display: grid;
        ">
            <button id="btnAddChart">add charts</button>
            <button id="btnToggleMode">layout mode</button>
            <button id="btnTogglePosition" data-int="1">label position</button>
        </div>
    </div>

    <wc-form-element
        name="theme"
        type="select"
        options='{"values":["dark", "ugly"]}'
        label="theme"
        capture_value_on="input"
        label_position="left"
        default_value="dark"
    ></wc-form-element>

    <wc-form-element
        name="test"
        type="date"
        label="test field"
        show_undo_button="true"
        show_menu_button="true"
        message="test message"
        options='{"values":["one", "two", "three"]}'
        default_value="two"
        capture_value_on="focusoutOrReturn"
    ></wc-form-element>

    <wc-form-element
        name="monotest"
        type="text"
        label="mono field"
        options='{"values":["one", "two", "three"]}'
        default_value="two"
        capture_value_on="focusoutOrReturn"
        mono="true"
    ></wc-form-element>

`)
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;
    that.DOMElement.style.display = "grid";
    that.DOMElement.style.height = "max-content";
    that.DOMElement.style.maxHeight = "100%";

    that.testPie = that.DOMElement.querySelector('#testMe');
    that.testFormElement = that.DOMElement.querySelector('wc-form-element[name="test"]');


    that.DOMElement.querySelector('#btnAddChart').addEventListener('click', (evt) =>{
        // I ain't fibbin' ... or am i?
        [2, 3 ,34, 8, 13, 5, 1, 21 ].forEach((fn) => {
            that.testPie.addChart({name: `L${fn}`, value: fn, chart_color: that.getRandoColor() });
        });
        that.testPie.badge_text = `chart layout: ${that.testPie.multiple_chart_mode}`;
    });

    that.DOMElement.querySelector('#btnToggleMode').addEventListener('click', (evt) => {
        that.testPie.multiple_chart_mode = (that.testPie.multiple_chart_mode == "stack")?'overlay':'stack';
        that.testPie.badge_text = `chart layout: ${that.testPie.multiple_chart_mode}`;
    });
    that.DOMElement.querySelector('#btnTogglePosition').addEventListener('click', (evt) => {
        const el = that.DOMElement.querySelector('#btnTogglePosition'); // you can never be sure about evt.target
        el.dataset.int = (parseInt(el.dataset.int) + 1);
        that.testPie.badge_position = ['top','center','bottom'][parseInt(el.dataset.int)%3];
    });


    // theme selector stuff
    that.themeSelector = that.DOMElement.querySelector('wc-form-element[name="theme"]');

    that.themeSelector.captureValueCallbackkkk = (value) => {
        if (that.themeStyle instanceof Element){ that.themeStyle.remove(); }
        if (value == "dark"){
            that.themeStyle = document.createElement('style');
            that.themeStyle.textContent = `
                :root {
                    --wc-formelement-disabled-label-color: var(--theme-disabled-color);
                    --wc-formelement-disabled-field-background-color: var(--theme-disabled-background-color);
                    --wc-formelement-disabled-field-text-color: var(--theme-darkest-grey);
                    --wc-formelement-required-label-color: var(--theme-gold);
                    --wc-formelement-label-color: inherit;
                    --wc-formelement-label-font: var(--theme-control-font);
                    --wc-formelement-button-background-color: var(--theme-button-background);
                    --wc-formelement-button-foreground-color: var(--theme-button-foreground);
                    --wc-formelement-field-background: var(--theme-dark-ui-surface);
                    --wc-formelement-field-border: 2px solid rgba(204, 204, 204, .4);
                    --wc-formelement-field-foreground: rgb(204, 204, 204);
                    --wc-formelement-field-boxshadow: 2px 2px 2px rgba(20, 22, 23, .8) inset;
                    --wc-formelement-field-font: inherit;
                    --wc-formelement-field-focus-background: transparent;
                    --wc-formelement-field-error-border-color: var(--theme-error-color);
                    --wc-formelement-optgroup-background-color: var(--theme-disabled-background-color);
                    --wc-formelement-optgroup-foreground-color: var(--wc-formelement-field-foreground);
                    --wc-formelement-option-background-color: rgb(20, 22, 23);
                    --wc-formelement-option-foreground-color: var(--wc-formelement-field-foreground);
                    --wc-formelement-message-color: var(--wc-formelement-button-background-color);
                    --wc-formelement-error-message-color: var(--theme-error-color);
                }
            `;
            document.body.appendChild(that.themeStyle);
        }else if (value == "ugly"){
            that.themeStyle = document.createElement('style');
            that.themeStyle.textContent = `
                :root {
                    --wc-formelement-disabled-label-color: ${that.getRandoColor()};
                    --wc-formelement-disabled-field-background-color: ${that.getRandoColor()};
                    --wc-formelement-disabled-field-text-color: ${that.getRandoColor()};
                    --wc-formelement-required-label-color: ${that.getRandoColor()};
                    --wc-formelement-label-color: inherit;
                    --wc-formelement-label-font: ${that.getRandoColor()};
                    --wc-formelement-button-background-color: ${that.getRandoColor()};
                    --wc-formelement-button-foreground-color: ${that.getRandoColor()};
                    --wc-formelement-field-background: ${that.getRandoColor()};
                    --wc-formelement-field-border: 2px solid r${that.getRandoColor()};
                    --wc-formelement-field-foreground: ${that.getRandoColor()};
                    --wc-formelement-field-boxshadow: 2px 2px 2px ${that.getRandoColor()} inset;
                    --wc-formelement-field-font: inherit;
                    --wc-formelement-field-focus-background: transparent;
                    --wc-formelement-field-error-border-color: ${that.getRandoColor()};
                    --wc-formelement-optgroup-background-color: ${that.getRandoColor()};
                    --wc-formelement-optgroup-foreground-color: ${that.getRandoColor()};
                    --wc-formelement-option-background-color: ${that.getRandoColor()};
                    --wc-formelement-option-foreground-color: ${that.getRandoColor()};
                    --wc-formelement-message-color: ${that.getRandoColor()};
                    --wc-formelement-error-message-color: ${that.getRandoColor()};
                }
            `;
            document.body.appendChild(that.themeStyle);
        }
    }

    // set default
    that.themeSelector.captureValue();

}




/*
    getRandoColor()
*/
getRandoColor(){
    return(`rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, .8)`);
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
