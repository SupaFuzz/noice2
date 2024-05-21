/*
    wcUtils.js
    function library for web component stuff
*/
import { isNull, isNotNull } from '../noiceCore.js';



/*
    pullElementReferences(el, cssSelector, nameFromDataset)
    return an object of the form: { <nameFromDataset>: Element}
    composed of children of the given element, matching cssSelector.

    for instance elemet 'el' has this HTMLContent:
    <div>
        <span data-name="first">Sponge</span>
        <span data-name="middle">B</span>
        <span data-name="last">Squarepants</span>
    </div>

    pullElementReferences(el, '[data-name]', name) would return:
    {
        first:<span data-name="first">Sponge</span>
        middle: <span data-name="middle">B</span>
        last: <span data-name="last">Squarepants</span>
    }

*/
function pullElementReferences(el, cssSelector, nameFromDataset){
    if (
        (el instanceof Element) &&
        isNotNull(cssSelector) &&
        isNotNull(nameFromDataset)
    ){
        let elements = [];
        el.querySelectorAll(`${cssSelector}`).forEach((a) => { elements[a.dataset[nameFromDataset]] = a; });
        return(elements);
    }else{
        throw(`pullElementReferences() invalid input`);
    }    
}
