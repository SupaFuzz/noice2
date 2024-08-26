/*
    workbenchUI.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { wcLeftPanelLayout } from '../../../lib/webComponents/wcLeftPanelLayout.js';
import { wcSelectableObject } from '../../../lib/webComponents/wcSelectableObject.js';
import { wcCollapsibleObject } from '../../../lib/webComponents/wcCollapsibleObject.js';
import { wcToggle } from '../../../lib/webComponents/wcToggle.js';
import { wcBasic } from '../../../lib/webComponents/wcBasic.js';

class workbenchUI extends noiceCoreUIScreen {


/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'workbenchUI',
            debug: false,
            themeStyle: null,
            runAnimation: false
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){
    return(`
        <wc-left-panel-layout title="test panel">
            <div slot="main-content">

                <!-- lets make a test menu -->
                <div data-_name="testMenu" style="display: grid; padding: 1em; user-select: none;">
                    <wc-selectable-object data-_name="one"><span slot="content">one</span></wc-selectable-object>
                    <wc-selectable-object data-_name="two"><span slot="content">two</span></wc-selectable-object>
                    <wc-selectable-object data-_name="three"><span slot="content">three</span></wc-selectable-object>
                    <wc-selectable-object data-_name="four"><span slot="content">four</span></wc-selectable-object>
                </div>


                <!-- test a collapsible object -->
                <wc-collapsible-object open_height="30em" handle_indicator="true" click_to_collapse="true">
                    <!--<span slot="handle">click me</span>-->
                    <div slot="content" style="display: grid;">

                        <wc-toggle label="show only active"></wc-toggle>
                        <wc-toggle label="show only at my location" on="true"></wc-toggle>
                        <wc-toggle label="show only completed"></wc-toggle>

                        <!--
                        <p>Lorem ipsum odor amet, consectetuer adipiscing elit. Ad malesuada aenean est et dignissim iaculis ultrices. Iaculis platea erat velit felis sapien. Orci ante quis ornare odio justo. Dictum lobortis ultricies commodo scelerisque pulvinar odio nascetur. Fames sagittis nec imperdiet posuere euismod lorem penatibus lobortis. Mauris nascetur magnis amet purus dui aenean suspendisse fames purus.</p>

                        <p>Dis aliquam inceptos fusce himenaeos proin dui mauris cras libero. Praesent taciti vel imperdiet sodales sem porttitor integer faucibus habitasse. Nulla eleifend enim amet curabitur nam vitae. Egestas sed ullamcorper senectus tempor dapibus leo. Lacinia maximus vestibulum in massa lectus purus ullamcorper efficitur. Aliquet interdum sociosqu nisi posuere interdum nostra urna vehicula. Vestibulum amet elementum, odio montes varius nascetur nascetur vestibulum. Sit imperdiet varius ad cubilia auctor. Torquent primis magna pellentesque ridiculus, himenaeos himenaeos varius.</p>

                        <p>Cubilia efficitur quis ornare facilisi malesuada facilisis nec quam aenean. Et blandit ligula venenatis placerat nostra justo molestie. Pharetra potenti aliquet pharetra eu accumsan platea velit. Tincidunt dui risus proin velit consectetur velit nam phasellus cursus. Blandit donec tortor porttitor viverra velit nisi tristique. Nisl mattis praesent interdum nisl vivamus. Sit parturient tempor ornare aenean tortor fames est nulla class. Urna erat libero habitant odio faucibus placerat. Metus praesent erat varius tincidunt varius.</p>

                        <p>Rhoncus at nisl mauris nascetur nisi porta mi. Enim etiam vehicula per amet penatibus nam orci elit. Duis odio praesent libero ridiculus vivamus; taciti luctus lacinia. Curae volutpat luctus velit turpis urna dictum ex pulvinar massa. Consequat odio cursus morbi; penatibus natoque montes luctus. Aptent eget tempor id lorem senectus at quis. Maecenas ipsum tortor sodales fusce cubilia aenean proin molestie. Efficitur sodales luctus nisi non habitasse pharetra justo nostra.</p>

                        <p>Rutrum tempus pretium vulputate urna ad a. Nisl est mattis proin ad cubilia sodales rhoncus lorem lacus. Penatibus porta parturient sem habitant praesent ad euismod interdum. Porta dolor augue aliquam varius hac nascetur aptent ante. Non sollicitudin tempus duis diam non; torquent aliquam. Morbi et felis duis suspendisse penatibus quam vehicula fusce. Quam euismod euismod ut, venenatis quisque cursus. Tellus ad vel in praesent mollis quisque tristique sed.</p>

                        <p>Dis aliquam inceptos fusce himenaeos proin dui mauris cras libero. Praesent taciti vel imperdiet sodales sem porttitor integer faucibus habitasse. Nulla eleifend enim amet curabitur nam vitae. Egestas sed ullamcorper senectus tempor dapibus leo. Lacinia maximus vestibulum in massa lectus purus ullamcorper efficitur. Aliquet interdum sociosqu nisi posuere interdum nostra urna vehicula. Vestibulum amet elementum, odio montes varius nascetur nascetur vestibulum. Sit imperdiet varius ad cubilia auctor. Torquent primis magna pellentesque ridiculus, himenaeos himenaeos varius.</p>

                        <p>Cubilia efficitur quis ornare facilisi malesuada facilisis nec quam aenean. Et blandit ligula venenatis placerat nostra justo molestie. Pharetra potenti aliquet pharetra eu accumsan platea velit. Tincidunt dui risus proin velit consectetur velit nam phasellus cursus. Blandit donec tortor porttitor viverra velit nisi tristique. Nisl mattis praesent interdum nisl vivamus. Sit parturient tempor ornare aenean tortor fames est nulla class. Urna erat libero habitant odio faucibus placerat. Metus praesent erat varius tincidunt varius.</p>

                        <p>Rhoncus at nisl mauris nascetur nisi porta mi. Enim etiam vehicula per amet penatibus nam orci elit. Duis odio praesent libero ridiculus vivamus; taciti luctus lacinia. Curae volutpat luctus velit turpis urna dictum ex pulvinar massa. Consequat odio cursus morbi; penatibus natoque montes luctus. Aptent eget tempor id lorem senectus at quis. Maecenas ipsum tortor sodales fusce cubilia aenean proin molestie. Efficitur sodales luctus nisi non habitasse pharetra justo nostra.</p>
                        -->

                    </div>
                </wc-collapsible-object>

                <div data-_name="testFrame"></div>

            </div>
        </wc-left-panel-layout>
    `);
}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){

    // a bit cheeky I must say
    let that = this;

    let wc = that.DOMElement.querySelector('wc-left-panel-layout');
    let tm = that.DOMElement.querySelector('div[data-_name="testMenu"]');
    tm.querySelectorAll('wc-selectable-object').forEach((el) => {
        el.selectCallback = (bool, slf) => {

            // example of how to do single-select
            if (slf.selected == true){
                Array.from(tm.querySelectorAll('wc-selectable-object')).filter((a) => {return(
                    (a.dataset._name != slf.dataset._name) &&
                    (a.selected == true)
                )}).forEach((a) => {
                    a.selected = false;
                });
            }
        }
    });

    let thing = new wcBasic({
        content: `
            <div data-_name="handle">open</div>
            <div class="content" data-_name="content" data-open="false">
                <p>Lorem ipsum odor amet, consectetuer adipiscing elit. Ad malesuada aenean est et dignissim iaculis ultrices. Iaculis platea erat velit felis sapien. Orci ante quis ornare odio justo. Dictum lobortis ultricies commodo scelerisque pulvinar odio nascetur. Fames sagittis nec imperdiet posuere euismod lorem penatibus lobortis. Mauris nascetur magnis amet purus dui aenean suspendisse fames purus.</p>

                <p>Dis aliquam inceptos fusce himenaeos proin dui mauris cras libero. Praesent taciti vel imperdiet sodales sem porttitor integer faucibus habitasse. Nulla eleifend enim amet curabitur nam vitae. Egestas sed ullamcorper senectus tempor dapibus leo. Lacinia maximus vestibulum in massa lectus purus ullamcorper efficitur. Aliquet interdum sociosqu nisi posuere interdum nostra urna vehicula. Vestibulum amet elementum, odio montes varius nascetur nascetur vestibulum. Sit imperdiet varius ad cubilia auctor. Torquent primis magna pellentesque ridiculus, himenaeos himenaeos varius.</p>

                <p>Cubilia efficitur quis ornare facilisi malesuada facilisis nec quam aenean. Et blandit ligula venenatis placerat nostra justo molestie. Pharetra potenti aliquet pharetra eu accumsan platea velit. Tincidunt dui risus proin velit consectetur velit nam phasellus cursus. Blandit donec tortor porttitor viverra velit nisi tristique. Nisl mattis praesent interdum nisl vivamus. Sit parturient tempor ornare aenean tortor fames est nulla class. Urna erat libero habitant odio faucibus placerat. Metus praesent erat varius tincidunt varius.</p>

                <p>Rhoncus at nisl mauris nascetur nisi porta mi. Enim etiam vehicula per amet penatibus nam orci elit. Duis odio praesent libero ridiculus vivamus; taciti luctus lacinia. Curae volutpat luctus velit turpis urna dictum ex pulvinar massa. Consequat odio cursus morbi; penatibus natoque montes luctus. Aptent eget tempor id lorem senectus at quis. Maecenas ipsum tortor sodales fusce cubilia aenean proin molestie. Efficitur sodales luctus nisi non habitasse pharetra justo nostra.</p>

                <p>Rutrum tempus pretium vulputate urna ad a. Nisl est mattis proin ad cubilia sodales rhoncus lorem lacus. Penatibus porta parturient sem habitant praesent ad euismod interdum. Porta dolor augue aliquam varius hac nascetur aptent ante. Non sollicitudin tempus duis diam non; torquent aliquam. Morbi et felis duis suspendisse penatibus quam vehicula fusce. Quam euismod euismod ut, venenatis quisque cursus. Tellus ad vel in praesent mollis quisque tristique sed.</p>

                <p>Dis aliquam inceptos fusce himenaeos proin dui mauris cras libero. Praesent taciti vel imperdiet sodales sem porttitor integer faucibus habitasse. Nulla eleifend enim amet curabitur nam vitae. Egestas sed ullamcorper senectus tempor dapibus leo. Lacinia maximus vestibulum in massa lectus purus ullamcorper efficitur. Aliquet interdum sociosqu nisi posuere interdum nostra urna vehicula. Vestibulum amet elementum, odio montes varius nascetur nascetur vestibulum. Sit imperdiet varius ad cubilia auctor. Torquent primis magna pellentesque ridiculus, himenaeos himenaeos varius.</p>

                <p>Cubilia efficitur quis ornare facilisi malesuada facilisis nec quam aenean. Et blandit ligula venenatis placerat nostra justo molestie. Pharetra potenti aliquet pharetra eu accumsan platea velit. Tincidunt dui risus proin velit consectetur velit nam phasellus cursus. Blandit donec tortor porttitor viverra velit nisi tristique. Nisl mattis praesent interdum nisl vivamus. Sit parturient tempor ornare aenean tortor fames est nulla class. Urna erat libero habitant odio faucibus placerat. Metus praesent erat varius tincidunt varius.</p>

                <p>Rhoncus at nisl mauris nascetur nisi porta mi. Enim etiam vehicula per amet penatibus nam orci elit. Duis odio praesent libero ridiculus vivamus; taciti luctus lacinia. Curae volutpat luctus velit turpis urna dictum ex pulvinar massa. Consequat odio cursus morbi; penatibus natoque montes luctus. Aptent eget tempor id lorem senectus at quis. Maecenas ipsum tortor sodales fusce cubilia aenean proin molestie. Efficitur sodales luctus nisi non habitasse pharetra justo nostra.</p>
            </div>
        `,
        initializedCallback: (slf) => {
            slf._elements.handle.addEventListener('click', (evt) => {
                slf._elements.content.dataset.open = (!(slf._elements.content.dataset.open == "true"));
                slf._elements.handle.textContent = (slf._elements.content.dataset.open == "true")?'close':'open';
            });
        },
        styleSheet: `
            div.content {
                display: block;
                overflow: auto;
                transition: height .5s;
            }
            div.content[data-open="false"] {
                height: 0px;
            }
            div.content[data-open="true"] {
                height: 40em;
            }
        `
    });
    // that.DOMElement.querySelector('div[data-_name="testFrame"]').appendChild(thing);




    /* brute force add button
    wc.initCallback = (slf) => {

        let btn = document.createElement('button');
        btn.className="icon";
        btn.style.background = `url('./gfx/buttons/burger.svg')`;
        btn.style.backgroundRepeat = "no-repeat";
        btn.style.backgroundSize = "contain";
        slf._elements.buttonContainer.appendChild(btn);

        let addBtn = document.createElement('button');
        addBtn.className="icon";
        addBtn.style.background = `url('./gfx/buttons/add_icon_dark.svg')`;
        addBtn.style.backgroundRepeat = "no-repeat";
        addBtn.style.backgroundSize = "contain";
        slf._elements.buttonContainer.appendChild(addBtn);
    }
    */

    // elegant add buttons
    let btn = document.createElement('button');
    btn.className="icon";
    btn.style.background = `url('./gfx/buttons/burger.svg')`;
    btn.style.backgroundRepeat = "no-repeat";
    btn.style.backgroundSize = "contain";
    wc.addButton({
        name: 'burger',
        element: btn,
        icon: true,
        order: 1,
        callback: (btn, slf, evt) => {
            console.log(`${btn.dataset.name} button clicked!`);
        }
    });

    let addBtn = document.createElement('button');
    addBtn.className="icon";
    addBtn.style.background = `url('./gfx/buttons/add_icon_dark.svg')`;
    addBtn.style.backgroundRepeat = "no-repeat";
    addBtn.style.backgroundSize = "contain";
    wc.addButton({
        name: 'add',
        element: addBtn,
        icon: true,
        order: 2,
        callback: (btn, slf, evt) => {
            console.log(`${btn.dataset.name} button clicked!`);
        }
    });


    // panelToggleCallback
    wc.panelToggleCallback = (open, slf) => {
        console.log(`panel is open: ${open}`);
    }

    // tmp for messing about
    window.wcTest = wc;

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
export { workbenchUI };
