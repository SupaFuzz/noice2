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
    title: { observed: true, accessor: true, type: 'str', value: '', forceInit: true },
    detail: { observed: true, accessor: true, type: 'str', value: '', forceInit: true },
    additionalDetail: { observed: true, accessor: true, type: 'str', value: '', forceInit: true },
    percent: { observed: true, accessor: true, type: 'float', value: 0, forceInit: true },
    run_animation: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    error: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    pie_chart_size: { observed: true, accessor: true, type: 'str', value: '6em', forceInit: true },
    animation_color: { observed: true, accessor: true, type: 'str', value: 'rgba(79, 185, 159, .5)', forceInit: true }
};
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    // come back to this as needed
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
        pie_chart_size:  (name,o,n,s) => { if (s.initialized){ s._elements.pieChart.size = `${n}`; }},
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
            <span data-_name="additionalDetail"></span>
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
            requestAnimationFrame(() => { that.animate(idx + .05); });
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
            display: grid;
            grid-template-columns: ${that.pie_chart_size} auto;
            place-items: center;
        }
        div[data-_name="message"] h2{
            margin: 0;
            padding: 0;
        }
        span[data-_name="additionalDetail"] {
            font-size: .8em;
            font-style: italic;
        }
`)}


/*
    LOH 5/7/25 @ 2345
    too tired to keep going but pretty much the above should get it done
    put it into the test harness and finish out the visual deets
    gonna need a few styleVars kinda things for sure
*/
