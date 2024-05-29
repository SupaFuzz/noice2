import { noiceObjectCore } from '../../lib/noiceCore.js';
import { noiceLogMessage, noiceLog, noiceApplicationCore } from '../../lib/noiceApplicationCore.js';
import * as CoreUI from '../../lib/noiceCoreUI.js';
import { noiceRadialPolygonPath } from '../../lib/noiceRadialPolygonPath.js';
import { noicePieChart } from '../../lib/noicePieChart.js';
import { Config } from '../config/applicationConfig.js';

import { mainUI } from './UI/mainUI.js';
import { chartsDemo } from './UI/chartsDemo.js';
import { tableDemo } from './UI/tableDemo.js';
import { dataClassDemo } from './UI/dataClassDemo.js';
import { webComponentDemo } from './UI/webComponentDemo.js';
import { webComponentPlayground } from './UI/webComponentPlayground.js';
import { wcTableScratch } from './UI/wcTableScratch.js';
import { layoutTest } from './UI/layouts.js';

/*
    DemoApp.js
    an instance of this object is the application code in the main thread
*/
class DemoApp extends noiceApplicationCore {




/*
    constructor({
        enableServiceWorker:    <bool (default: true)>
        debug:                  <bool (default: false)>
    })
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version: Config.appVersion,
        _className: 'LDApplication',
        localStorageKey: 'LogisticsDashboard',
        debug: false,
        enableServiceWorker: false,
        threads: { },
        threadSignalHandlers: { }
    },defaults),callback);
}



/*
    startup()
    startup the app, init UI state etc
*/
startup(){
    let that = this;
    return(new Promise((toot, boot) => {
        that.log(`${that._className} v${that._version} | startup() | called`);

        // make a uiHolder why not?
        that.uiHolder = new CoreUI.noiceCoreUIScreenHolder({
            UIList: {
                main: new mainUI({
                    label: 'main',
                     _app: that,
                     title: `${Config.appName} v${Config.appVersion}`,
                     burgerMenuTitle: Config.appName,
                     useDefaultBurgerMenu: true,
                     UIs: {
                         uiOne: new chartsDemo({ sortOrder: 1, title: 'noiceBarChart / noicePieChart', _app:that, debug:false }),
                         uiTwo: new tableDemo({ sortOrder: 2, title: 'noiceCoreUITable', _app:that, debug:false }),
                         uiThree: new dataClassDemo({ sortOrder: 3, title: 'noiceCoreValue', _app:that, debug:false }),
                         wcDemo: new webComponentDemo({ sortOrder: 4, title: 'web components demo', _app:that, debug:true }),
                         wcPlay: new webComponentPlayground({ sortOrder: 5, title: 'web component playground', _app:that, debug:true }),
                         wcTableStuff: new wcTableScratch ({ sortOrder: 6, title: 'wcTable scratch', _app:that, debug:true }),
                         layouts: new layoutTest ({ sortOrder: 6, title: 'layouts', _app:that, debug:true }),
                     }
                 })
            },
            defaultUI: 'main',
            showDefaultUI: true
        }).append(document.body);

        // unlock the burgerMenu button (if we had async stuff to do you might need to await stuff before doing this)
        that.uiHolder.getUI('main').btnBurger.disabled = false;


        // return ourself so the caller could do stuff if needed
        toot(that);

    }));
} // end DemoApp




}
export { DemoApp };


/*
    startup the app when the DOM is ready
*/
document.addEventListener("DOMContentLoaded", (evt) => {
    new DemoApp({
        // external configs here
    }).startup().then((app) =>{

        // expose app object to global namespace for ease of debugging (REMOVE BEFORE FLIGHT)
        window.app = app;

    }).catch((error) =>{
        console.log(`DemoApp.startup() threw unexpectedly: ${error}`);
    });
});
