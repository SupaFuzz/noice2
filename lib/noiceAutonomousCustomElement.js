/*
    noiceAutonomousCustomElement.js
    4/9/24 Amy Hicox <amy@hicox.com>

    this is a base class for web components derived from the base HTMLElement class
    documentation to come

*/
import { isNull, isNotNull } from './noiceCore.js';
class noiceAutonomousCustomElement extends HTMLElement {




// override this so static functions know what subclass they're in
static classID = noiceAutonomousCustomElement;




/*
    register the class with the document as the specified elementName
*/
static registerElement(elementName){

    if (isNull(elementName)){
        throw('elementName not specified');
    }else{
        if (! (customElements.getName(this.classID) == elementName)){
            customElements.define(elementName, this.classID);
        }

    }
}




/*
    static classAttributeDefaults
    notes to come. this is basically default values
    and observedAttributes etc.

    note: attributes can't contain capital letters or dashes.
    arbitrary spec bs. is what it is.

    demo stuff here obviously

    possible attributes on the attribute:
        type: <enum(str, int, float, bool)> - not gonna go ham on it, but normalize values on attribute setters by this
        value: <any> | a value of 'type' to use as default
        observed: <bool> - include in observedAttributes if true | required
        accessor: <bool> - create an object accessor for it if true | required
        writeable: <bool> - if acccessor:true | make accessor writeable if true | default: true
        enumerable: <bool> - if accessor:true | include accessor in Object.keys(), etc if true | default: true
        configurable: <bool> - if accessor:true | set 'configurable' on Object.defineProperty() | default: true

    on the configurable one just read about it, it's complicated
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

*/
static classAttributeDefaults = {
    example_string: { observed: true, accessor: true, type: 'str', value: '2em', },
    example_int: { observed: true, accessor: true, type: 'int', value: 420 },
    example_float: { observed: true, accessor: true, type: 'float', value: 1.618 },
    example_bool: { observed: true, accessor: true, type: 'bool', value: false },
    example_enum: { observed: true, accessor: true, type: 'enum', value: 'apples', values: ['Apples', 'Oranges', 'Grapes'] }
}



/*
    observableAttributes
    if these attribute names appear in the markup, call attributeChangedCallback()
    when they change value.
*/
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor()
    we can't do much in here on account of restrictions on things in the Element class
    you'll need to override this for each child class both to change the _className
    and the path to classAttributeDefaults
*/
constructor(args){
    super();
    this._className = 'noiceAutonomousCustomElement';
    this._version = 1;
    this._initialized = false;
    this._style = null;

    // override this by setting the attribute, you know the deal
    this.debug = false;

    // override this in subclasses, or by just setting the attribute
    this.log = console.log;

    // we have to make a hard copy of the classAttributeDefaults to use as our local copy
    this.attributeDefaults = JSON.parse(JSON.stringify(this.getAttributeDefaults()));

    // import some handy functions
    this.isNull = isNull;
    this.isNotNull = isNotNull;

    // if args is an object
    if (args instanceof Object){
        // merge values into attributeDefaults
        Object.keys(args).filter((a) => {return(this.attributeDefaults.hasOwnProperty(a))}, this).forEach((a) => { this.attributeDefaults[a].value = args[a]; }, this);

        // merge anything else into this (but filtering some stuff)
        Object.keys(args).filter((a) => {return(
            (! this.attributeDefaults.hasOwnProperty(a)) &&
            (['_className', '_version', '_initialized', 'attributeDefaults', 'isNull', 'isNotNull', 'attributeChangeHandlers'].indexOf(a) < 0)
        )}, this).forEach((a) => { this[a] = args[a]; }, this);
    }

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
    */
    this.attributeChangeHandlers = {};
    function dummyAttributeChangeHandler(name, oldval, newval, selfRef){
        let el = selfRef.shadowDOM.querySelector(`span.value[data-name="${name}"]`);
        if (el instanceof Element){ el.textContent = newval; }
    }
    Object.keys(this.attributeDefaults).forEach((a) => {
        this.attributeChangeHandlers[a] = (name, oldval, newval, selfRef) => { dummyAttributeChangeHandler(name, oldval, newval, selfRef); }
    }, this);
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(noiceAutonomousCustomElement.classAttributeDefaults);
}




/*
    spawnAttributeAccessors()
    does what it says on the tin lol
*/
spawnAttributeAccessors(){
    Object.keys(this.attributeDefaults).forEach((a) => {
        Object.defineProperty(this, a, {
            writeable: this.attributeDefaults[a].hasOwnProperty('writeable')?(this.attributeDefaults[a].writeable === true):true,
            enumerable: this.attributeDefaults[a].hasOwnProperty('enumerable')?(this.attributeDefaults[a].enumerable === true):true,
            configurable: this.attributeDefaults[a].hasOwnProperty('configurable')?(this.attributeDefaults[a].configurable === true):true,
            get: () => {
                return( this.dataTypeMunger(a, (this.initialized && this.hasAttribute(a))?this.getAttribute(a):this.attributeDefaults[a].value, "get") );
            },
            set: (v) => {

                if (this.initialized && this.hasAttribute(a)){
                    this.setAttribute(a, this.dataTypeMunger(a, v, "set"));
                }else{
                    let old = this.dataTypeMunger(a,this[a]);
                    this.attributeDefaults[a].value = this.dataTypeMunger(a,v,"set");
                    if (this.initialized && (this.attributeChangeHandlers instanceof Object) && (this.attributeChangeHandlers[a] instanceof Function)){
                        this.attributeChangeHandlers[a](a, old, this.attributeDefaults[a].value, this);
                    }
                }
            }
        })
    }, this);
}




/*
    spawnDefaultAttributes()
    this is called out of initializem, since according to spec we aren't allowed to create new attributes
    out of the constructor. For attributeDefaults where .forceAttribute == true, we go in and create
    each attribute with the default value if it doesn't exist already
*/
spawnDefaultAttributes(){
    Object.keys(this.attributeDefaults).filter((name) => {return(
        (! this.hasAttribute(name)) &&
        this.attributeDefaults[name].hasOwnProperty('forceAttribute') &&
        (this.attributeDefaults[name].forceAttribute === true)
    )}, this).forEach((name) => {
        this.setAttribute(name, this.attributeDefaults[name].value);
    }, this);
}




/*
    dataTypeMunger(name, value, op)
    mangle the given value into the 'type' defined in the attributeDefaults entry idenfied by 'name'
    supported types:
        str, int, float, bool, enum, json
    if op is specified this indicates a "get" or a "set" which is really only important on a JSON type
*/
dataTypeMunger(name, value, op){
    switch(this.attributeDefaults[name].hasOwnProperty('type')?this.attributeDefaults[name].type:null){
        case 'str':
            return(`${value}`);
            break;
        case 'int':
            return(parseInt(value));
            break;
        case 'float':
            return(parseFloat(value));
            break;
        case 'bool':
            return(/^TRUE$/i.test(`${value}`));
            break;
        case 'enum':

            // note: our enums are non-case-sensitive cause we rollz like that
            if (this.attributeDefaults[name].values instanceof Array){
                let m = this.attributeDefaults[name].values.filter((a) => { return(`${a}`.toLowerCase() == `${value}`.toLowerCase()) });
                if (m.length > 0){
                    return(m[0]);
                }else{
                    throw(`${this._className} v${this._version} | dataTypeMunger(${name}, ${value}, ${op}) | invalid enum value`);
                }
            }else{
                throw(`${this._className} v${this._version} | dataTypeMunger(${name}, ${value}, ${op}) | enum value list missing from attributeDefaults`);
            }
            break;
        case 'json':

            // NEW HOTNESS -- just respect the op, don't try to guess which direction we're headed
            switch(op){
                case "get":
                    if (this.isNotNull(value)){
                        let a = JSON.parse(`${value}`);
                        if (
                            (a instanceof Object) &&
                                this.attributeDefaults[name].hasOwnProperty('key') &&
                                this.isNotNull(this.attributeDefaults[name].key) &&
                                (a[this.attributeDefaults[name].key] instanceof Array)
                        ){
                            return(a[this.attributeDefaults[name].key])
                        }else if (a instanceof Object){
                            return(a);
                        }else{
                            return(value);
                        }
                    }else{
                        return(value);
                    }
                    break;
                case "set":
                    if (
                        (value instanceof Array) &&
                        this.attributeDefaults[name].hasOwnProperty('key') &&
                        this.isNotNull(this.attributeDefaults[name].key)
                    ){
                        let b = {};
                        b[this.attributeDefaults[name].key] = value;
                        return(JSON.stringify(b));
                    }else if (value instanceof Object){
                        return(JSON.stringify(value));
                    }else{
                        return(value);
                    }
                    break;
            }
            break;
        default:
            return(value);
    }
}




/*
    initalized
*/
get initialized(){ return(this._initialized === true); }
set initialized(v){ this._initialized = (v === true); }




/*
    initialize()
    this is called from connectedCallback() if this.initialized === false
    this creates all of the elements in the shadowDOM, etc.
*/
initialize(){

    this.spawnDefaultAttributes();

    this.shadowDOM = this.attachShadow({ mode: 'open'});
    this.shadowDOM.appendChild(this.getHTMLContent());

    // override the style getter in your subclasses or alternately use the style attribute setter
    this.updateStyle();

    // mark it done so we don't do it again
    this.initialized = true;

    // if we have an initializedCallback, call it
    if (this.initializedCallback instanceof Function){ this.initializedCallback(this); }
}




/*
    DOMElement getter
    returns the root level div ... or I mean at least the first element in the shadowDOM
    with this._className in it's classList. You can break that if you need to, but this accessor
    won't work as expected.
*/
get DOMElement(){
    return(this.initialized?this.shadowDOM.querySelector(`.${this._className}`):null);
}




/*
    updateStyle()
    if we have an embedded stylesheet delete it
    then make an embedded stylesheet with the content of this.style
    then add it to the shadowDOM
*/
updateStyle(){

    // remove ALL embedded stylesheets
    this.shadowDOM.querySelectorAll('style').forEach((el) => {el.remove(); });

    // add whatever we got on this.style as our embedded stylesheet
    if (isNotNull(this.style)){
        const style = document.createElement('style');
        style.textContent = this.style;
        this.shadowDOM.appendChild(style);
    }
}





/*
    getHTMLContent()
    override AF!
    return unto me a DOM tree suitable for inserting into the shadowDOM
*/
getHTMLContent(){
    // just a dumb demo - lists our managed attributes
    let ul = document.createElement("div");
    ul.className = "defaultAttributeList";
    Object.keys(this.attributeDefaults).forEach((name) => {
        let li = document.createElement('li');
        li.insertAdjacentHTML('afterbegin', `<span class="label">${name}</span> <span class="value" data-name="${name}">${this[name]}</span>`);
        ul.appendChild(li);
    }, this);
    return(ul);
}




/*
    style attribute getter. override this in your subclasses
    if you don't want to apply a style return null
*/
get style(){
    return(this.isNotNull(this._style)?this._style:this.isNotNull(this.defaultStyle)?this.defaultStyle:'');
}
set style(v){
    this._style = v;
    this.updateStyle();
}



/*
    defaultStyle attribute getter
    if this._style is null and you call the .style attribute getter
    you'll get this. or you'll get null if this isn't defined!
*/
get defaultStyle(){return(`
    div.defaultAttributeList {
        font-family: monospace;
    }
    div.defaultAttributeList span.label {
        font-weight: bolder;
    }
    div.defaultAttributeList span.label:after {
        content: ':'
    }
    div.defaultAttributeList span.value {
        color: rgb(191, 191, 24);
        background-color: rgba(191, 191, 24, .1);
        padding: 0 .5em 0 .5em;
        border-radius: .25em;
    }
`)}


/*
    connectedCallback()
    the root element has been inserted into a document object
*/
connectedCallback(){
    if (! this.initialized){ this.initialize(); }

    // may need some kinda callback mechanism here for extensibility?
    // something that can do setups n stuff?
}




/*
    attributeChangedCallback(name, oldValue, newValue)
*/
attributeChangedCallback(name, oldValue, newValue){

    /*
        this allows us to copy defaults specified in the markup in as object defaults
        DO NOT take the initialized check out or youre doin' an infinite loop mkay?
    */
    if (! this.initialized){ this[name] = newValue; }

    /*
        for *reasons* we cant just use the attribute accessors for this
        if you want changing the attribute value to actually do something
        the function to that has to be fired from here. Or if it doesn't have an
        attribute in the markup in the attribute accessor (see spawnAttributeAccessors())

        SOOO ...

        this.attributeChangeHandlers[name] = function(name, oldValue, newValue, selfRef)
    */
    if ( this.initialized && (this.attributeChangeHandlers instanceof Object) && (this.attributeChangeHandlers[name] instanceof Function) ){
        this.attributeChangeHandlers[name](name, this.dataTypeMunger(name, oldValue, "get"), this.dataTypeMunger(name, newValue, "get"), this);
    }


}




/*
    getCustomElementTag()
*/
getCustomElementTag(){
    return(customElements.getName(this.constructor));
}




/*
    getEventListenerWrapper(<functionReference>)
    return a function in which we call thusly:
        functionReference(event, self)

    this allows us to pass a self reference to event handlers
    and it allows you to save a variable reference to the function
    so you can remove it from the eventHanler later
*/
getEventListenerWrapper(functionReference){
    let that = this;
    return(
        function(e){ functionReference(e, that); }
    )
}




}


export { noiceAutonomousCustomElement };
