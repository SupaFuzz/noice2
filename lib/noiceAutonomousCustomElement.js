/*
    noiceAutonomousCustomElement.js
    4/9/24 Amy Hicox <amy@hicox.com>

    this is a base class for web components derived from the base HTMLElement class
    documentation to come

    TO-DO: type stuff on the attributeDefaults
*/
class noiceAutonomousCustomElement extends HTMLElement {




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
    size: { observed: true, accessor: true, type: 'str', value: '2em', },
    value: { observed: true, accessor: true, type: 'int', value: '0' },
    badge_text: { observed: true, accessor: true, type: 'str', value: 'test badge text' },
    its_a_bool: { observed: true, accessor: true, type: 'bool', value: false }
}
static observedAttributes = Object.keys(noiceAutonomousCustomElement.classAttributeDefaults).filter((a) =>{ return(noiceAutonomousCustomElement.classAttributeDefaults[a].observed === true); });




/*
    constructor()
    we can't do much in here on account of restrictions on things in the Element class
    you'll need to override this for each child class both to change the _className
    and the path to classAttributeDefaults
*/
constructor(){
    super();
    this._className = 'noiceAutonomousCustomElement';
    this._version = 1;
    this._initialized = false;

    // we have to make a hard copy of the classAttributeDefaults to use as our local copy
    this.attributeDefaults = JSON.parse(JSON.stringify(noiceAutonomousCustomElement.classAttributeDefaults));

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
    spawnAttributeAccessors()
    does what it says on the tin lol
*/
spawnAttributeAccessors(){
    Object.keys(this.attributeDefaults).forEach((a) => {
        Object.defineProperty(this, a, {
            writeable: this.attributeDefaults[a].hasOwnProperty('writeable')?(this.attributeDefaults[a].writeable === true):true,
            enumerable: this.attributeDefaults[a].hasOwnProperty('enumerable')?(this.attributeDefaults[a].enumerable === true):true,
            configurable: this.attributeDefaults[a].hasOwnProperty('configurable')?(this.attributeDefaults[a].configurable === true):true,
            get: () => { return(this.initialized?this.getAttribute(a):this.attributeDefaults[a].value); },
            set: (v) => { if (this.initialized){ this.setAttribute(a, v); }else{ this.attributeDefaults[a].value = v; }}
        })
    }, this);
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
    this.shadowDOM = this.attachShadow({ mode: 'open'});
    this.shadowDOM.appendChild(this.getHTMLContent());

    // hey lets demo some embedded CSS
    this.shadowDOM.appendChild(this.getStyleElement())

    this.initialized = true;
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
    getStyleElement()
    might wanna override it, returns a scoped style object
*/
getStyleElement(){
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    return(style)
}




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

    // legit logging later
    console.log(`attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);

    /*
        this allows us to copy defaults specified in the markup in as object defaults
        DO NOT take the initialized check out or youre doin' an infinite loop mkay?
    */
    if (! this.initialized){ this[name] = newValue; }

    /*
        for *reasons* we cant just use the attribute accessors for this
        if you want changing the attribute value to actually do something
        the function to that has to be fired from here.

        SOOO ...

        this.attributeChangeHandlers[name] = function(name, oldValue, newValue, selfRef)
    */
    if ( this.initialized && (this.attributeChangeHandlers instanceof Object) && (this.attributeChangeHandlers[name] instanceof Function) ){
        this.attributeChangeHandlers[name](name, oldValue, newValue, this);
    }


}



}


export { noiceAutonomousCustomElement };
