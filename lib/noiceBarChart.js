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

        // svg coordinate system
        _chartWidth:            200,
        _chartHeight:           200,
        _bkndCornerRound:       50,

        // container div dimensions
        _width:                 '2em',
        _height:                '2em',
        _zIndex:                0,

        chartSVGClass:          'noiceBarChart',
        chartBackroundClass:    'chartBknd',
        badgeClass:             'barChartBadge'
    },defaults),callback);

    this.DOMElement.style.display  = "block";
    this.DOMElement.style.overflow = "hidden";

    this.setup();

} // end constructor




/*
    html getter
*/
get html(){
    return(`<svg class="${this.chartSVGClass}" viewBox="0 0 ${this.chartWidth} ${this.chartHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect class="${this.chartBackroundClass}" x="0" y="0" width="${this.chartWidth}" height="${this.chartHeight}" rx="${this.bkndCornerRound}"/>
    </svg>`);
}




/*
    setup()
*/
setup(){
    this.svg = this.DOMElement.querySelector(`svg.${this.chartSVGClass}`);
    this.chartBknd = this.DOMElement.querySelector(`.${this.chartBackroundClass}`);

    // init DOM values that have getter/setters
    ['width', 'height', 'zIndex'].forEach((at) => { this[at] = this[at]; }, this);

    // DOM manglin'
    this.DOMElement.style.position = 'relative';
    this.svg.style.position = 'absolute';
    this.svg.style.zIndex = '-1';

    // create the badgeTxt
    let div = document.createElement('div');
    div.className = this.badgeClass;
    let necessaryStyle = {
        display:                'grid',
        gridTemplateColumns:    '1fr',
        placeItems:             'center',
        position:               'absolute',
        zIndex:                 '1',
        top:                    '0px',
        left:                   '0px',
        width:                  '100%',
        height:                 '100%',
    };
    Object.keys(necessaryStyle).forEach((p) => { div.style[p] = necessaryStyle[p]; });
    this.badgeTxtDOMElement = document.createElement('span');
    this.badgeTxtDOMElement.className = 'badgeTxt';
    this.badgeTxtDOMElement.style.alignSelf = 'center';
    div.appendChild(this.badgeTxtDOMElement);
    this.DOMElement.appendChild(div);

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
    this.setSVGViewbox();
}
get height(){ return(this._height); }
set height(v){
    if (this.DOMElement instanceof Element){ this.DOMElement.style.height = v; }
    this._height = v;
    this.setSVGViewbox();
}




/*
    svg attribute setters
*/
setSVGViewbox(){ if (this.svg instanceof SVGElement){ this.svg.setAttribute("viewBox", `0 0 ${this.chartWidth} ${this.chartHeight}`); } }
get chartWidth(){ return(this._chartWidth); }
set chartWidth(v){
    this._chartWidth = v;
    this.setSVGViewbox();
    let that = this;
    requestAnimationFrame(() => {
        if (that.chartBknd instanceof SVGElement){ that.chartBknd.setAttribute("width", that.chartWidth); }
    });

}
get chartHeight(){ return(this._chartHeight); }
set chartHeight(v){
    this._chartHeight = v;
    this.setSVGViewbox();
    let that = this;
    requestAnimationFrame(() => {
        if (that.chartBknd instanceof SVGElement){ that.chartBknd.setAttribute("height", that.chartHeight); }
    });
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
    background stuff
*/
get bkndCornerRound(){ return(this._bkndCornerRound); }
set bkndCornerRound(v){
    this._bkndCornerRound = v;
    if (this.chartBknd instanceof SVGElement){
        this.chartBknd.setAttribute('rx', v);
    }
}




}
export { noiceBarChart };
