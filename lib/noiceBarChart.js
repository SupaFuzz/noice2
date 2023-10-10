/*
    noiceBarChart.js
    10/9/23 @ 2250 -- started. this is work in progress
*/
import { noiceCoreUIElement } from './noiceCoreUI.js';
import { noiceObjectCore } from './noiceCore.js';

class noiceBarChart extends noiceCoreUIElement {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'noiceBarChart',
        _charts:                {},
        _runAnimation:          false,
        _animationFrame:        0,
        _badgeText:             null,

        // chart stuff
        _graphSpacing:          '.25em',
        _subGraphSpacing:       '.128em',
        _chartContainerMargin:  '.25em',
        //_graphCornerRound:       50,

        // container div dimensions
        _width:                 '16em',
        _height:                '9em',
        _zIndex:                0,

        chartSVGClass:          'noiceBarChart',
        chartBackroundClass:    'chartBknd',
        badgeClass:             'barChartBadge'
    },defaults),callback);

    this.setup();

} // end constructor




/*
    html getter
*/
get html(){
    return(`
        <div class="chartContainer" data-templatename="chartContainer" data-templateattribute="true"></div>
        <div class="label" data-templatename="label" data-templateattribute="true"></div>
    `)
}




/*
    setup()
*/
setup(){
    let that = this;
    that.DOMElement.style.display = 'grid';
    that.DOMElement.style.gridTemplateRows = `auto 1.5em`;
    that._DOMElements.chartContainer.style.display = "grid";
    that._DOMElements.chartContainer.style.alignItems = "end";

    ['width', 'height', 'zIndex', 'chartContainerMargin'].forEach((a)=>{this[a] = this[a]; });

    // remove me
    this.DOMElement.style.backgroundColor = "purple";
}




/*
    container div attributes
*/
get zIndex(){ return(this._zIndex); }
set zIndex(v){
    if (this.DOMElement instanceof Element){ this.DOMElement.style.zIndex = v; }
    this._zIndex = v;
}
get width(){ return(this._width); }
set width(v){
    if (this.DOMElement instanceof Element){ this.DOMElement.style.width = v; }
    this._width = v;

}
get height(){ return(this._height); }
set height(v){
    if (this.DOMElement instanceof Element){ this.DOMElement.style.height = v; }
    this._height = v;
}
get graphSpacing(){ return(this._graphSpacing); }
set graphSpacing(v){
    this._graphSpacing = v;
    // insert shenanigans here
}
get subGraphSpacing(){ return(this._subGraphSpacing); }
set subGraphSpacing(v){
    this._subGraphSpacing = v;
    // insert shenanigans here
}
get chartContainerMargin(){ return(this._chartContainerMargin); }
set chartContainerMargin(v){
    this._chartContainerMargin = v;
    if (this._DOMElements.chartContainer instanceof Element){ this._DOMElements.chartContainer.style.margin = `${v}`; }
}



/*
    badgeTxt stuff
*/
get badgeTxt(){ return(this._badgeText); }
set badgeTxt(v){
    this._badgeText = v;
    if (this.badgeTxtDOMElement instanceof Element){
        this.badgeTxtDOMElement.textContent = this.isNotNull(this._badgeText)?`${this._badgeText}`:'';
    }
}




/*
    addChart({
        name: <str>,
        value: <pct>,
        order: <int>,
        color: <rgba>
        subValue: <pct>
        subValueColor: <rgba>
    })
*/
addChart(v){
    let that = this;

    that._charts[v.name] = v;

    let gtc = '';
    for (let i=0; i<Object.keys(that._charts).length; i++){ gtc += ' 1fr'; }
    that._DOMElements.chartContainer.style.gridTemplateColumns = gtc;

    that._DOMElements.chartContainer.innerHTML = '';
    Object.keys(that._charts).sort((a,b)=>{return(a.order - b.order)}).forEach((chartName) => {
        let chart = that._charts[chartName];

        // make the chart lane
        chart.DOMElement = document.createElement('div');
        chart.DOMElement.className = "chartLane";
        ['name', 'value', 'order'].forEach((a) => { chart.DOMElement.dataset[a] = v[a]; });
        ['width', 'height'].forEach((a) => {chart.DOMElement.style[a] = '100%'; });
        chart.DOMElement.style.display = 'grid';
        chart.DOMElement.style.alignItems = 'end';
        that._DOMElements.chartContainer.appendChild(chart.DOMElement);

        // make the value
        chart.valueElement = document.createElement('div');
        chart.valueElement.className = 'chartBar';
        chart.valueElement.style.display = 'grid';
        chart.valueElement.style.alignItems = 'end';
        chart.valueElement.style.backgroundColor = chart.color;
        chart.valueElement.style.height = `${chart.value}%`;
        chart.valueElement.style.margin = `0 ${that.graphSpacing} 0 ${that.graphSpacing}`;

        // make the subValue if we have one
        if (chart.hasOwnProperty('subValue') && (! isNaN(parseInt(chart.subValue)))){
            chart.subValueElement = document.createElement('div');
            chart.subValueElement.className = 'chartBar';
            chart.subValueElement.style.backgroundColor = chart.subValueColor;
            chart.subValueElement.style.height = `${chart.value}%`;
            chart.subValueElement.style.margin = `0 ${that.subGraphSpacing} 0 ${that.subGraphSpacing}`;
            chart.valueElement.appendChild(chart.subValueElement);
        }

        chart.DOMElement.appendChild(chart.valueElement);

        /*
            LOH 10/10/23 @ 1417 -- giving up for now
            I've wasted all of yesterday (unpaid holiday work) and well over half of today
            trying to get this to work.

            This sort of does, in that I can stack a secondary value inside the primary value
            this is a problem. beause the secondary value can never be more than 100% of the primary
            value.

            this approach is not going to work without needing to do positioning and layer stacking
            which -- ok that's totally possible but I've got no more time to waste on this.

            I just don't. This is a rabbit hole and i don't have time to go down it.

            the build a static SVG then insert it as a background so it scales approach would be better
            honestly but the coordinate system is a godawful nightmare and that's even deeper of a
            rabit hole.

            fuckit. i've got pie charts. So we're doing it with pie charts

        */
    })
}



}
export { noiceBarChart };
