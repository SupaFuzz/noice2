/*
    wcProgressUI.js
    5/7/25 Amy Hicox <amy@hicox.com>

    a layout like this:

    --------------------------------------------------------------------------------
    |                                                                              |
    |                                                                              |
    |                           <title>                                            |
    |   <wcPieChart>            <detail>                                           |
    |                           <additionalDetail>                                 |
    |                                                                              |
    |                                                                              |
    --------------------------------------------------------------------------------

    attributes:
        title:  <str>
        detail: <str>
        additionalDetail: <str>
        percent: <float>
        run_animation: <bool>
        error: <bool>
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { wcPieChart } from './wcPieChart.js';

class wcProgressUI extends noiceAutonomousCustomElement {

static classID = wcProgressUI;
static classAttributeDefaults = {
    title: { observed: true, accessor: true, type: 'elementAttribute', value: '', forceInit: true },
    detail: { observed: true, accessor: true, type: 'elementAttribute', value: '', forceInit: true },
    additional_detail: { observed: true, accessor: true, type: 'elementAttribute', value: '', forceInit: true },
    percent: { observed: true, accessor: true, type: 'float', value: 0, forceInit: true },
    run_animation: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    pie_chart_size: { observed: true, accessor: true, type: 'str', value: '6em', forceInit: true },
    animation_color: { observed: true, accessor: true, type: 'str', value: 'rgba(79, 185, 159, .5)', forceInit: true },
    animation_speed: { observed: true, accessor: true, type: 'enum', values: ['slow','fast'], value: 'slow', forceAttribute: true }
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'color': { value: 'rgb(198, 198, 198)', global: true },
    'border-width': { value: '.128em', global: true },
    'border-color': { value: 'transparent', global: true },
    'chart-color': { value: 'rgb(198, 198, 198)', global: true },
    'chart-stroke-color': { value: 'transparent', global: true },
    'chart-stroke-width': { value: '1px', global: true },
    'chart-background-color': { value: 'rgb(51, 51, 51)', global: true },
}





/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcProgressUI';
    this._version = 1;
    this.cssVarPrefix = '--wc-progress-ui';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcProgressUI.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    this.attributeChangeHandlers = {
        pie_chart_size: (name,o,n,s) => { if (s.initialized){ s._elements.pieChart.size = `${n}`; }},
        percent: (name,o,n,s) => { if (s.initialized){ s._elements.pieChart.value = `${n}`; }},
        run_animation:  (name,o,n,s) => { if (s.initialized){
            if ((n == true) && (!(o == true))){ s.animate(0); }
        }}

        /* come back to these
        need one for:
            animation_color

        burger_menu_open: (name, oldValue, newValue, slf) => {  if (oldValue != newValue){ slf.openBurgerMenu(newValue); } },
        status_menu_open: (name, oldValue, newValue, slf) => {  if (oldValue != newValue){ slf.openStatusMenu(newValue); } },
        enable_burger_menu: (name,o,n,s) => { s.enableBurgerMenu = n; },
        burger_menu_title: (name,o,n,s) => {
            if (s.initialized && (s.burgerMenu instanceof wcBalloonDialog)){ s.burgerMenu.title = n; }
        },
        status_menu_title: (name,o,n,s) => {
            if (s.initialized && (s.statusMenu instanceof wcBalloonDialog)){ s.statusMenu.title = n; }
        }
        */
    };

    /* probably not needed
    this.mergeClassDefaults({
        _enableBurgerMenu: false
    });
    */
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcProgressUI.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcProgressUI.classStyleDefaults);
}



/*
    getHTMLContent()
*/
getHTMLContent(){
    let div = document.createElement('div');
    div.className = this._className;
    div.insertAdjacentHTML('afterbegin', `
        <wc-pie-chart data-_name="pieChart"></wc-pie-chart>
        <div data-_name="message">
            <h2 data-_name="title"></h2>
            <span data-_name="detail"></span><br>
            <span data-_name="additional_detail"></span>
        </div>
    `);
    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    let that = this;

    // setup a layer in the pieChart for the animation
    that._elements.pieChart.addChart({name: 'animation', chart_color: `${that.animation_color}`, value: 0 });

    // hack a css override onto the pie-chart to relay our vars into it
    that._elements.pieChart.addStyleSheet(`
        circle.chartBknd {
            fill: ${this.styleVar('chart-background-color')};
        }
        path[data-name="mainChart"] {
            fill: ${this.styleVar('chart-color')};
            stroke: ${this.styleVar('chart-stroke-color')};
            stroke-width: ${this.styleVar('chart-stroke-width')};
        }
    `);

    // send the initialized event
    that.dispatchEvent(new CustomEvent("initialized", { detail: { self: that }}));



}




/*
    animate(idx)
    run an animation frame
*/
animate(idx){
    let that = this;
    if (that.initialized){
        that._elements.pieChart.updateChart('animation', 5, (Math.PI*idx));
        if (that.run_animation){
            requestAnimationFrame(() => {
                let inc = .05;
                if (that.animation_speed == 'slow'){ inc = .01; }
                that.animate(idx + inc);
            });
        }else{
            that._elements.pieChart.updateChart('animation', 0, 0);
        }
    }
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        font-size: 1.25rem;
        color: ${this.styleVar('color')};
    }
    div.wcProgressUI {
        display: grid;
        grid-template-columns: min-content auto;
    }
    wc-pie-chart {
        margin: .25em;
    }
    div[data-_name="message"] {
        align-content: center;
        padding: .75em;
        border-left: ${this.styleVar('border-width')} solid;
        border-color: ${this.styleVar('border-color')};
        font-size: .85em;
    }
    div[data-_name="message"] h2{
        margin: .25em 0 .25em 0;
        font-size: 1.25em;
        padding: 0;
    }
    span[data-_name="detail"] {
        display: inline-block;
        margin: .25em 0 .25em 0;
        font-size: 1em;
    }
    span[data-_name="additional_detail"] {
        display: inline-block;
        font-size: .8em;
        font-style: italic;
    }
`)}




} // end class
const _classRegistration = wcProgressUI.registerElement('wc-progress-ui');
export { _classRegistration as wcProgressUI };
