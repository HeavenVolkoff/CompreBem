/**
 * Created by Vítor Augusto da Silva Vasconcellos on 9/11/15.
 *
 * ------- Background Script -------
 * @link: https://developer.chrome.com/extensions/event_pages
 *
 * This is the extension's main script, where all logic will happens
 *
 * ----------- ATTENTION -----------
 * - It is indispensable that all relevant events are registered
 * - All Persistent data MUST be saved using the storage API or IndexedDB
 */

var ProconList = require("./ProconList.js");
var ReclameAqui = require("./ReclameAqui.js");

function onPageLoad(details){
    console.log(details.url);
}

(function(){
    "use strict";
    console.log("Start Extension...");
    //Event Registration
    chrome.webNavigation.onBeforeNavigate.addListener(onPageLoad);
    chrome.webNavigation.onDOMContentLoaded.addListener(onPageLoad);
})();

