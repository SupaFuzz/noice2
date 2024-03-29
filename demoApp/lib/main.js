import { noiceObjectCore } from '../../lib/noiceCore.js';
import { noiceLogMessage, noiceLog, noiceApplicationCore } from '../../lib/noiceApplicationCore.js';
import * as CoreUI from '../../lib/noiceCoreUI.js';
import { noiceRadialPolygonPath } from '../../lib/noiceRadialPolygonPath.js';
import { noicePieChart } from '../../lib/noicePieChart.js';
import { Config } from '../config/applicationConfig.js';

import { mainUI } from './UI/mainUI.js';
import { testUIOne } from './UI/testUIOne.js';
import { testUITwo } from './UI/testUITwo.js';
import { testUIThree } from './UI/testUIThree.js';
import { testUIFour } from './UI/testUIFour.js';


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
    startup the app, init UI state etc\
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
                         uiOne: new testUIOne({ sortOrder: 1, title: 'noiceBarChart / noicePieChart', _app:that, debug:false }),
                         uiTwo: new testUITwo({ sortOrder: 2, title: 'noiceCoreUITable', _app:that, debug:false }),
                         uiThree: new testUIThree({ sortOrder: 3, title: 'noiceFormElement', _app:that, debug:false }),
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
