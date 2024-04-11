/*
    wpPieChart.js
    4/9/24 Amy Hicox <amy@hicox.com>

    to-do:
        * addChart() - add mode:stack | overlay (but that's gonna require some math so later LOL)
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { isNull, isNotNull } from '../noiceCore.js';

class wpPieChart extends noiceAutonomousCustomElement {

// let static functions know what subclass they're in
static classID = wpPieChart;

// attributeDefaults
static classAttributeDefaults = {
    size: { observed: true, accessor: true, type: 'str', value: '1em', },
    value: { observed: true, accessor: true, type: 'int', value: '0' },
    show_chart: { observed: true, accessor: true, type: 'bool', value: true },
    show_background: { observed: true, accessor: true, type: 'bool', value: true },
    background_color: { observed: true, accessor: true, type: 'str', value: 'rgb(24, 35, 38)' },
    chart_color: { observed: true, accessor: true, type: 'str', value: 'rgba(191, 191, 24, .8)' },
    chart_stroke: { observed: true, accessor: true, type: 'str', value: 'rgba(17, 47, 65, .6)' },
    chart_stroke_width: { observed: true, accessor: true, type: 'str', value: '1px' },
    show_badge: { observed: true, accessor: true, type: 'bool', value: false },
    badge_position: { observed: true, accessor: true, type: 'enum', values: ['top', 'center', 'bottom'], value: 'center' },
    badge_text: { observed: true, accessor: true, type: 'str', value: 'test badge text' },
    chart_size: { observed: true, accessor: true, type: 'int', value: 200 },
    run_animation: { observed: true, accessor: true, type: 'bool', value: false },
}

// observedAttributes
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
        size:  (name, oldValue, newValue, slf) => { slf.setSize(newValue); },
        value: (name, oldValue, newValue, slf) => { slf.updateChart('main', newValue); },
        show_chart: (name, oldValue, newValue, slf) => { slf.toggleCharts(newValue); },
        show_background: (name, oldValue, newValue, slf) => { slf.toggleBackground(newValue); },
        background_color: (name, oldValue, newValue, slf) => { slf.setBackgroundFill(newValue); },
        chart_color: (name, o, n, s) => { s.setChartFillColor('main', n); },
        chart_stroke: (name, o, n, s) => { s.setChartStrokeColor('main', n); },
        chart_stroke_width: (name, o, n, s) => { s.setChartStrokeWidth('main', n); },
        show_badge: (name, o, n, s) => { s.toggleBadge(n); },
        badge_position: (name, o, n, s) => { s.setBadgePosition(n); }
    }
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.style.width = this.size;
    div.style.height = this.size;

    // the svg
    div.insertAdjacentHTML('afterbegin', `
        <svg viewBox="${(this.chart_size/-2)} ${(this.chart_size/-2)} ${this.chart_size} ${this.chart_size}" width="99%" height="99%" xmlns="http://www.w3.org/2000/svg">
            <circle class="chartBknd" cx="0" cy="0" r="${(this.chart_size/2) * (7/8)}" fill="${this.background_color}"/>
        </svg>
        <span class="badgeTxt" style="display:${this.show_badge?'grid':'none'}">${this.badge_text}</span>
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

    // setup stuff for the badge text
    this.badgeTextElement = div.querySelector(`span.badgeTxt`);
    this.setBadgePosition(this.badge_position, true);

    return(div);
}




/*
    style attribute
*/
get style(){return(`
    div.${this._className} {
        position: relative;
    }
    svg {
        position: absolute;
        z-index: -1;
    }
    span.badgeTxt {
        display: grid;
        justify-items: center;
        align-items: center;
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
`)}




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




/*
    setSize(size)
    set height and width of root element
*/
setSize(size){
    if (this.initialized){
        let el = this.shadowDOM.querySelector(`div.${this._className}`);
        if (el instanceof Element){
            el.style.width = size;
            el.style.height = size;
        }
    }
}




/*
    toggleCharts(bool)
    if we have charts show them if true, else hide them
*/
toggleCharts(bool){
    if (this.initialized){
        Object.keys(this._charts).forEach((chartName) => {
            if (bool === true){
                this.svgDOMObject.appendChild(this._charts[chartName]);
            }else{
                this._charts[chartName].remove();
            }
        }, this )
    }
}




/*
    toggleBackground(bool)
    hide or show the chart background
*/
toggleBackground(bool){
    if (this.initialized){
        this.svgDOMObject.querySelector('circle.chartBknd').style.opacity = bool?1:0;
    }
}




/*
    setBackgroundFill(newValue)
    set the fill color of the background circle
*/
setBackgroundFill(newValue){
    if (this.initialized){
        this.svgDOMObject.querySelector('circle.chartBknd').style.fill = newValue;
    }
}




/*
    setChartFillColor(chartName, color)
*/
setChartFillColor(chartName, color){
    if ((this.initialized) && (this._charts[chartName] instanceof Element)){
        this._charts[chartName].style.fill = color;
    }
}




/*
    setChartStrokeColor(chartName, color)
*/
setChartStrokeColor(chartName, color){
    if ((this.initialized) && (this._charts[chartName] instanceof Element)){
        this._charts[chartName].style.stroke = color;
    }
}




/*
    setChartStrokeWidth(chartName, val)
*/
setChartStrokeWidth(chartName, val){
    if ((this.initialized) && (this._charts[chartName] instanceof Element)){
        this._charts[chartName].style.strokeWidth = val;
    }
}




/*
    toggleBadge(bool)
    hide or show the badge
*/
toggleBadge(bool){
    if ((this.initialized) && (this.badgeTextElement instanceof Element)){
        this.badgeTextElement.style.display = bool?'grid':'none';
    }
}




/*
    setBadgePosition(v)
*/
setBadgePosition(v, force){
    if (((this.initialized) || (force === true)) && (this.badgeTextElement instanceof Element)){
        switch(v){
            case 'top':
                this.badgeTextElement.style.alignItems = "baseline";
                this.badgeTextElement.style.marginTop = "-1em";
                break;
            case 'center':
                this.badgeTextElement.style.alignItems = "center";
                this.badgeTextElement.style.marginTop = null;
                break;
            case 'bottom':
                this.badgeTextElement.style.alignItems = "end";
                this.badgeTextElement.style.marginTop = "1em";
                break;
        }
    }
}



}

export { wpPieChart };
