/*
    webComponentDemo.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcSplitter } from '../../../lib/webComponents/wcSplitter.js';
import { wcTable } from '../../../lib/webComponents/wcTable.js';

class layoutTest extends noiceCoreUIScreen {



/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'layoutTest',
            debug: false,
            themeStyle: null
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){
    return(`
        <div class="eh" style="
            height: 100%;
            width: 100%;
            overflow: hidden;
            display: grid;
            grid-template-rows: 2em auto;
        ">
            <div class="btnContiner"><button class="btnOrientation">vertical</button></div>
            <div class="spltCntr" style="
                height: 100%;
                width: 100%;
                overflow: hidden;
            ">
                <wc-splitter orientation="vertical"></wc-splitter>
            </div>
        </div>
    `);
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){

    this.splitter = this.DOMElement.querySelector('wc-splitter');

    this.splitter.a = new wcTable({
        label: 'A',
        columns: [
            { name: 'species', order: 1, type: 'char', width: '5em', disableCellEdit: true, visible:false },
            { name: 'first', order: 2, type: 'char', width: '10em', disableModifyAll: true },
            { name: 'middle', order: 3, type: 'char', width: '5em' },
            { name: 'last', order: 4, type: 'char', width: '10em' },
            { name: 'num', order: 5, type: 'int', width: '5em' }
        ],
        rows: [
            { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
            { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
            { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
            { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
            { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
            { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
        ],
        select_mode: 'single',
        show_footer_message: true,
        allow_column_sort: true,
        show_btn_prefs: true,
        show_btn_select_all: true,
        show_btn_select_none: true,
        show_btn_export: true,
        show_btn_search: true,
        allow_cell_edit: true,
        fit_parent: true,
    });
    this.splitter.a.style.margin = '.5em .5em 0 .5em';
    this.splitter.b = new wcTable({
        label: 'B',
        columns: [
            { name: 'species', order: 1, type: 'char', width: '5em', disableCellEdit: true, visible:false },
            { name: 'first', order: 2, type: 'char', width: '10em', disableModifyAll: true },
            { name: 'middle', order: 3, type: 'char', width: '5em' },
            { name: 'last', order: 4, type: 'char', width: '10em' },
            { name: 'num', order: 5, type: 'int', width: '5em' }
        ],
        rows: [
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
           { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
           { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
           { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
           { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
           { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
           { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
           { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
           { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
           { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
           { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
           { species: 'snail', first: 'Gary', middle: 'X', last: 'Squarepants', num: 1, test: "heck" },
           { species: 'crustacean', first: 'Eugene', middle: "C", last: "Krabbs", num: 12, test: "is" },
           { species: 'canine', first: 'Scooby', middle: "D", last: "Doo", num: 420, test: "going"  },
           { species: 'starfish', first: 'Patrick', middle: "", last: "Starr", num: 419, test: "on" },
           { species: 'cat', first: 'Mo', middle: 'M', last: 'Hicox', num: 5, test: "what" },
           { species: 'cat', first: 'Jazzy', middle: 'J', last: 'Hicox', num: 82, test: "the" },
        ],
        select_mode: 'single',
        show_footer_message: true,
        allow_column_sort: true,
        show_btn_prefs: true,
        show_btn_select_all: true,
        show_btn_select_none: true,
        show_btn_export: true,
        show_btn_search: true,
        allow_cell_edit: true,

        fit_parent: true,
    });
    this.splitter.b.style.margin = '.5em .5em 0 .5em';

    let that = this;
    this.DOMElement.querySelector('button.btnOrientation').addEventListener('click', (evt) => {
        evt.target.textContent = (evt.target.textContent == "vertical")?"horizontal":"vertical";
        that.splitter.orientation = evt.target.textContent;
    });

    /*
    this.splitter.a =
`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus in est sem. Praesent nec convallis neque. Cras ultrices tristique felis, in accumsan diam rhoncus ultrices. Mauris sit amet nibh ac quam malesuada pulvinar. Quisque et porta massa. In hac habitasse platea dictumst. Sed id gravida mi. Nulla vel lacinia purus, at laoreet sapien. Nulla nec pulvinar lorem. Donec vel eleifend quam, a consectetur tellus. Mauris quis metus odio. Maecenas velit est, molestie ac porttitor eu, placerat porttitor est. Praesent pharetra sodales tellus vitae condimentum. Aliquam erat volutpat. Sed vel gravida nisl, eu fermentum augue. Sed eu mattis turpis.

Duis quis lectus ut neque facilisis porta. Nulla eu diam a purus interdum tempus et at diam. In porttitor, erat eget aliquet faucibus, orci augue viverra tortor, et suscipit ante quam eget purus. In pharetra augue dictum aliquet posuere. Suspendisse luctus aliquet augue, nec convallis neque iaculis id. Vestibulum volutpat vulputate porttitor. Cras auctor nisi in porta sodales. Vestibulum in tempor turpis. Aliquam erat volutpat. In velit libero, pharetra sed tincidunt ut, venenatis a mi. Nam mi quam, tincidunt vitae hendrerit vitae, maximus non elit. Proin in tempus velit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec libero nibh, laoreet eu nulla at, mattis rutrum tellus. Sed vestibulum pretium convallis.

Sed aliquam pulvinar lacus posuere facilisis. Donec sapien dolor, luctus ac malesuada efficitur, pharetra ornare purus. Duis id eleifend sapien, vitae ultricies dolor. Nullam vel nisi ipsum. Integer ac tortor vel est bibendum vehicula id a leo. Aliquam sapien ante, tempus nec vehicula nec, egestas non urna. Fusce pretium tincidunt tellus nec molestie.

Morbi ut luctus purus. Aenean gravida molestie est ac suscipit. Nunc rutrum, elit eu molestie elementum, ligula velit vestibulum diam, ut facilisis ligula magna et orci. Cras efficitur placerat neque, nec sollicitudin tellus egestas et. Phasellus condimentum orci at posuere vestibulum. Suspendisse et euismod lectus. Sed volutpat est vitae tellus malesuada, condimentum pretium mauris aliquam. Cras convallis, sapien quis consequat rutrum, dolor elit blandit metus, ut hendrerit justo orci ut erat.

Mauris blandit maximus erat. Suspendisse potenti. Mauris dapibus tristique bibendum. Nulla a efficitur elit. Etiam varius porta consequat. Interdum et malesuada fames ac ante ipsum primis in faucibus. In hac habitasse platea dictumst. Nam laoreet pharetra enim, id imperdiet eros tincidunt eget. Fusce odio ante, pellentesque eget vestibulum dignissim, gravida lobortis massa. Duis ultricies sed ipsum eu condimentum. Etiam ornare lectus vel lacus finibus porttitor. Duis semper mauris magna, vehicula vestibulum lorem semper iaculis. Nunc placerat, erat nec dictum accumsan, ante arcu efficitur libero, et malesuada eros neque eu ipsum. Nunc laoreet sagittis magna vitae sollicitudin. Donec commodo fringilla ipsum quis pharetra.`

    this.splitter.b = this.splitter.a;
    */

}



/*
    gainFocus()
    the UI is gaining focus from a previously unfocused state
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){

        // be outa here wit ya badass ...
        toot(true);
    }));
}




/*
    losefocus(forusArgs)
    fires every time we gain focus
*/
loseFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




}
export { layoutTest };
