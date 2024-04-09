/*
    wpPieChart.js
    4/9/24 Amy Hicox <amy@hicox.com>

    I'm gonna try to re-implement noicePieChart as a webComponent
    lessee how this goes
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
class wpPieChart extends noiceAutonomousCustomElement {




static classAttributeDefaults = {
    size: { observed: true, accessor: true, type: 'str', value: '2em', },
    value: { observed: true, accessor: true, type: 'int', value: '0' },
    badge_text: { observed: true, accessor: true, type: 'str', value: 'test badge text' },
    run_animation: { observed: true, accessor: true, type: 'bool', value: false },
    show_chart: { observed: true, accessor: true, type: 'bool', value: true },
    chart_size: { observed: true, accessor: true, type: 'int', value: 200 },
    background_color: { observed: true, accessor: true, type: 'str', value: 'rgb(24, 35, 38)' },
    chart_color: { observed: true, accessor: true, type: 'str', value: 'rgba(191, 191, 24, .8)' },
    chart_stroke: { observed: true, accessor: true, type: 'str', value: 'rgba(17, 47, 65, .6)' },
    chart_stroke_width: { observed: true, accessor: true, type: 'str', value: '1px' }
}
static observedAttributes = Object.keys(wpPieChart.classAttributeDefaults).filter((a) =>{ return(wpPieChart.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(){
    super();
    this._className = 'wpPieChart';
    this._version = 1;
    this._initialized = false;
    this._charts = {};

    // we have to make a hard copy of the classAttributeDefaults to use as our local copy
    this.attributeDefaults = JSON.parse(JSON.stringify(wpPieChart.classAttributeDefaults));

    // spawn the attribute accessors
    this.spawnAttributeAccessors();

    /*
        attributeChangeHandlers
        since attribute changes have to flow through attributeChangedCallback()
        rather than the usual object attribute accessor approach, you're gonna
        have to map your value change callbacks n stuff here.
        thx. i hate it

        this is just a dumb textContent updater thing that's the same
        for all of 'em but you know .. this'll be a thing in subclasses fo sho
    this.attributeChangeHandlers = {};
    function dummyAttributeChangeHandler(name, oldval, newval, selfRef){
        let el = selfRef.shadowDOM.querySelector(`span.value[data-name="${name}"]`);
        if (el instanceof Element){ el.textContent = newval; }
    }
    Object.keys(this.attributeDefaults).forEach((a) => {
        this.attributeChangeHandlers[a] = (name, oldval, newval, selfRef) => { dummyAttributeChangeHandler(name, oldval, newval, selfRef); }
    }, this);
    */
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this.className;

    // the svg
    div.insertAdjacentHTML('afterbegin', `
        <svg viewBox="${(this.chart_size/-2)} ${(this.chart_size/-2)} ${this.chart_size} ${this.chart_size}" width="99%" height="99%" xmlns="http://www.w3.org/2000/svg">
            <circle class="chartBknd" cx="0" cy="0" r="${(this.chart_size/2) * (7/8)}" fill="${this.background_color}"/>
        </svg>
    `);

    this.svgDOMObject = div.querySelector('svg');

    // spawn the main chart path (other's you'll have to call addPieChart() on your own)
    this._charts.main = this.getPieChartPath(
        this.attributeDefaults.chart_color.value,
        this.attributeDefaults.chart_stroke.value,
        this.attributeDefaults.chart_stroke_width.value,
        this.attributeDefaults.value.value
    );
    this.svgDOMObject.appendChild(this._charts.main);

    return(div);
}




/*
    getPieChartPath(fill, stroke, strokeWidth, value)
    make a path and set its default value, then return it
    it's on the caller to append to the shadowDOM svg element
*/
getPieChartPath(fill, stroke, strokeWidth, value){
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('d', this.getDatD(value));
    return(path);
}




/*
    getDatD(percent)
    get the path "d" attribute for the given percentage
*/
getDatD(percent){
    let p = ((percent%100)/100);
    let radius = ((this.attributeDefaults.chart_size.value/2) * (7/8));
    let angle = 2 * Math.PI * p;

    /* time for some quick "d" */
    return(`
        M 0,0
        L 0, ${-1 * radius}
        A ${radius} ${radius} 0 ${(p<=.5)?0:1} 1 ${(radius * Math.sin(angle))}, ${(-1 * radius * Math.cos(angle))}
        L 0,0 Z
    `);
}




}
customElements.define("wp-pie-chart", wpPieChart);
export { wpPieChart };
