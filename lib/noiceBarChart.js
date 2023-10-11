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
        _chartLayers:           [],
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
    that._DOMElements.chartContainer.style.position = "relative";
    //that._DOMElements.chartContainer.style.alignItems = "end";

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
    renderCharts()
    (re?)draw the charts
*/
renderCharts(){
    let that = this;

    // tear it all down
    that._DOMElements.chartContainer.innerHTML = '';

    // figure out how many layers we need
    let maxLayers = 1;
    Object.keys(that._charts).forEach((chartName)=>{ if (that._charts[chartName].layers.length > maxLayers){ maxLayers = that._charts[chartName].layers.length; }})

    // get the grid-template-columns string corresponding to the number of charts we have
    let gtc = '';
    for (let i=0; i<Object.keys(that._charts).length; i++){ gtc += ' 1fr'; }

    // spawn layers
    that._chartLayers = [];
    for (let i=0; i<maxLayers; i++){
        let chartLayer = document.createElement('div');
        chartLayer.className = 'chartLayer';
        chartLayer.style.width = '100%';
        chartLayer.style.height = '100%';
        chartLayer.style.position = 'absolute';
        chartLayer.style.top = '0px';
        chartLayer.style.left = '0px';
        chartLayer.style.zIndex = i;
        chartLayer.style.display = 'grid';
        chartLayer.style.alignItems = 'end';
        chartLayer.style.gridTemplateColumns = gtc;

        // render identical chartLanes on every layer
        Object.keys(that._charts).sort((a,b)=>{return(a.order - b.order)}).forEach((chartName) => {
            let div = document.createElement('div');
            div.className = 'chartLane';
            div.dataset.name = chartName;
            div.style.display = 'grid';
            div.style.alignItems = 'end';
            ['width', 'height'].forEach((a) => { div.style[a] = '100%'; });
            chartLayer.appendChild(div);
        });
        that._DOMElements.chartContainer.appendChild(chartLayer);
        that._chartLayers.push(chartLayer);

        /*
            LOH 10/10/23 @ 2308
            up to here it works!
            next steps:
                * add graph labels that we can set with DOMElement at bottom of each chartLane
                * rounded corners lol
                * scale to highest value -- can probably fix this by munging pct values to %ofmax or what have you
                
        */
    }

    // render chart values
    Object.keys(that._charts).sort((a,b)=>{return(a.order - b.order)}).forEach((chartName) => {

        let chart = that._charts[chartName];
        chart.layers.forEach((layer, idx) => {
            // spawn value into chartLane on layer
            let div = document.createElement('div');
            div.className = "chartBar";
            div.style.backgroundColor = layer.color;
            div.style.height = `${layer.value}%`;
            div.style.margin = `0 ${layer.hasOwnProperty('graphSpacing')?layer.graphSpacing:that.graphSpacing} 0 ${layer.hasOwnProperty('graphSpacing')?layer.graphSpacing:that.graphSpacing}`;
            that._chartLayers[idx].querySelector(`div.chartLane[data-name="${chartName}"]`).appendChild(div);
        })
    });
}



/*
    addChart({
        name: <str>,
        order: <int>,
        layers: [{name:<str>, value:<pct>, color:<rgba>, graphSpacing:<cssUnits>}, ...]
    })
*/
addChart(v){
    this._charts[v.name] = v;
    this.renderCharts();
}



}
export { noiceBarChart };
