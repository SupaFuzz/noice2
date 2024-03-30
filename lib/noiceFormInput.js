/*
    noiceFormInput.js
    Amy Hicox <amy@hicox.com> 3/28/24

    this is a rewrite of noiceCoreUIFormElement
    documentation to follow I guess lol

    lets chart a bold new noiceCoreUI'less future lol

    this is for value-bearing variants of the input element:
        checkbox        https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
        color           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
        date            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date
        datetime-local  https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
        email           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
        file            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
        month           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month
        number          https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
        password        https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password
        radio           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
        range           https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range
        search          https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search
        tel             https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/tel     (telephone number)
        text            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text
        time            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time
        url             https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url
        week            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week


    ok. I'm starting to get an idea of what we need to do here.
    we want a lightweight replacement for noiceCoreUIFormElement that is extnsible,
    doesn't have all the roads to nowwhere features, and implements the above without
    a bajillion separate classes.

    or maybe we do want the classes I dunno.

    what I think we need

        noiceCore
            noiceCoreUtility
                noiceValueBearingObject (it has value setters, getters, and async callbacks)
                     noiceFormInput (basically this)


*/
import { noiceObjectCore, noiceCoreUtility, noiceException } from './noiceCore.js';



/*
    class: noiceFormInput
*/
class noiceFormInput extends noiceCoreUtility {




/*
    constructor({})
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version: 1,
        _className: 'noiceFormElement',
        _html:      null

    },defaults),callback);
}




/*
    html attribute getter (override me aight?)
*/


}
export { noiceFormElement }
