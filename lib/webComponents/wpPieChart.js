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

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        value: (name, oldValue, newValue, slf) => { slf.updateChart('main', newValue); }
    }
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
    let p = ((parseFloat(percent)%100)/100);
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




/*
    updateChart(charName, value)
*/
updateChart(name, value){
    if ((this._charts instanceof Object) && (this._charts[name] instanceof Element) && (! isNaN(parseFloat(value)))) {
        this._charts[name].setAttribute('d', this.getDatD(value));
    }
}




/*
    addChart({name: <str>, chart_color: <str>, chart_stroke: <str>, chart_stroke_width: <str>, value: <float>})
    if a chart with the given name doesn't exist, spawn it with the given properties.
*/
addChart(args){
    if (
        this.initialized &&
        (args instanceof Object) &&
        args.hasOwnProperty('name') &&
        (this._charts instanceof Object) &&
        (! this._charts.hasOwnProperty(args.name)) &&
        args.hasOwnProperty('value') &&
        (! isNaN(parseFloat(args.value)))

    ){
        this._charts[args.name] = this.getPieChartPath(
            args.hasOwnProperty('chart_color')?args.chart_color:this.attributeDefaults.chart_color.value,
            args.hasOwnProperty('chart_stroke')?args.chart_stroke:this.attributeDefaults.chart_stroke.value,
            args.hasOwnProperty('chart_stroke_width')?args.chart_stroke_width:this.attributeDefaults.chart_stroke_width.value,
            args.value
        );
        this.svgDOMObject.appendChild(this._charts[args.name]);
    }
}




/*
    removeChart(name)
*/
removeChart(name){
    if (
        this.initialized &&
        (this._charts instanceof Object) &&
        (this._charts.hasOwnProperty(name))
    ){
        this._charts[name].remove();
        delete(this._charts[name]);
    }
}




}
customElements.define("wp-pie-chart", wpPieChart);
export { wpPieChart };
