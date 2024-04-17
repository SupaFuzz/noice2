/*
    testUIOne.js
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
        <div class="btnContainer">
            <button id="btnAddChart">add charts</button>
            <button id="btnToggleMode">layout mode</button>
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
            that.testPie.addChart({name: `L${fn}`, value: fn, chart_color: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, .8)` });
        });
        that.testPie.badge_text = `chart layout: ${that.testPie.multiple_chart_mode}`;
    });

    that.DOMElement.querySelector('#btnToggleMode').addEventListener('click', (evt) => {
        that.testPie.multiple_chart_mode = (that.testPie.multiple_chart_mode == "stack")?'overlay':'stack';
        that.testPie.badge_text = `chart layout: ${that.testPie.multiple_chart_mode}`;
    });

    // theme selector stuff
    that.themeSelector = that.DOMElement.querySelector('wc-form-element[name="theme"]');
    that.themeSelector.captureValueCallback = (value) => {
        if (that.themeStyle instanceof Element){ that.themeStyle.remove(); }
        if (value == "dark"){
            that.themeStyle = document.createElement('style');
            that.themeStyle.textContent = `
                :root {
                    --theme-highlight-color: rgb(242, 177, 52);
                    --theme-error-color: rgb(230, 0, 161);
                    --theme-disabled-color: rgb(98, 109, 112);
                    --theme-disabled-background-color: rgb(81, 91, 94);
                    --theme-button-background: rgba(191, 191, 24, .8);
                    --theme-button-foreground: rgba(5, 15, 20, .8);

                    --theme-field-label: inherit;
                    --theme-field-font: inherit;
                    --theme-field-label-font: Comfortaa;
                    --theme-required-field-label: var(--theme-highlight-color);
                    --theme-field-background: radial-gradient(ellipse at top left, rgba(98, 109, 112, .25), rgba(98, 109, 112, .1), rgba(0, 0, 0, .25));
                    --theme-field-border: 2px solid rgba(204, 204, 204, .4);
                    --theme-field-foreground: rgb(204, 204, 204);
                    --theme-field-boxshadow: 2px 2px 2px rgba(20, 22, 23, .8) inset;
                    --theme-field-focus-background: transparent;
                    --theme-field-option-background: rgb(20, 22, 23);
                }
            `;
            document.body.appendChild(that.themeStyle);
        }else if (value == "ugly"){
            that.themeStyle = document.createElement('style');
            that.themeStyle.textContent = `
                :root {
                   --theme-highlight-color: rgb(242, 177, 52);
                   --theme-error-color: rgb(230, 0, 161);
                   --theme-disabled-color: rgb(98, 109, 112);
                   --theme-disabled-background-color: rgb(81, 91, 94);
                   --theme-button-background: red;
                   --theme-button-foreground: blue;

                   --theme-field-label: orange
                   --theme-field-font: inherit;
                   --theme-field-label-font: Comfortaa;
                   --theme-required-field-label: var(--theme-highlight-color);
                   --theme-field-background: radial-gradient(ellipse at top left, rgba(98, 109, 112, .25), rgba(98, 109, 112, .1), rgba(0, 0, 0, .25));
                   --theme-field-border: 2px solid green;
                   --theme-field-foreground: yellow;
                   --theme-field-boxshadow: 2px 2px 2px rgba(20, 22, 23, .8) inset;
                   --theme-field-focus-background: transparent;
                   --theme-field-option-background: rgb(20, 22, 23);
                }
            `;
            document.body.appendChild(that.themeStyle);
        }
    }

    // set default
    that.themeSelector.captureValueCallback(that.themeSelector.value);
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
