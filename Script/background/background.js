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
var async = require("async");
var func = require("./functions.js");

(function(){
    "use strict";

    var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
    var reclamaAquiVerifier = false;
    var proconList = global.proconList = new ProconList();
    var reclameAqui = global.reclameaqui = new ReclameAqui();
    var tabs = {};

    function onPageLoad(details){
        if(details.frameId === 0){

            if(tabs[details.tabId] && tabs[details.tabId].url === func.cleanUrl(details.url)){
                console.log("Entry Already existent");
                chrome.pageAction.show(details.tabId);
                return;
            }

            async.parallel(
                {
                    /**
                     * Function to ensure the tab id is correct and not some pre-rendering background process tab
                     * @param callback
                     */
                    tabId: function verifyTabId(callback){
                        chrome.tabs.query(
                            {
                                active: true
                            },
                            function(tabs){
                                chrome.tabs.get(
                                    details.tabId,
                                    function(tab){
                                        if(chrome.runtime.lastError){
                                            console.log("Tab don't Exists, wait...");
                                            chrome.tabs.onReplaced.addListener(
                                                function tabReplace(addedTabId, removedTabId){
                                                    console.log("Tab Replaced, attempting again...");
                                                    if(removedTabId === tabs[0].id){
                                                        chrome.tabs.onReplaced.removeListener(tabReplace);
                                                        callback(null, addedTabId);
                                                    }
                                                }
                                            );
                                        }else{
                                            console.log("Tab exists, go...");
                                            callback(null, tab.id);
                                        }
                                    }
                                );
                            }
                        );
                    },
                    /**
                     * Verify if procon has the site in it's list
                     * @param callback
                     */
                    procon: function verifyProcon(callback){
                        proconList.exists(details.url, function(err, name, exists){
                            if(err !== null){
                                console.log("Error ao verificar lista do procon");
                                callback(err);
                            }

                            console.log(name + (exists? " está contido na lista do Procon, e não é recomendado" : " não está contido na lista do Procon"));
                            callback(null, exists);
                        });
                    },
                    /**
                     * Get website informations from reclameAqui
                     * @param callback
                     */
                    reclameAqui: function getReclameAqui(callback){
                        reclameAqui.query(details.url, function(err, result){
                            if(err !== null){
                                console.log("Error ao verificar empresa no Reclame Aqui");
                                callback(err);

                            }

                            switch (typeof result){
                                case "object":
                                    reclamaAquiVerifier = false;
                                    iframe.src = "";
                                    callback(null, result);

                                    break;
                                case "function":
                                    if(!reclamaAquiVerifier){
                                        console.log("Can't reach ReclameAqui, reloading iframe and trying again...");
                                        reclamaAquiVerifier = true;

                                        iframe.onload = function(){
                                            console.log("Response arrived");
                                            reclameAqui.query(details.url, result);
                                            iframe.onload = null;
                                        };
                                        iframe.src = ReclameAqui.queryUrl;

                                    }else{
                                        console.log("Trying again...");
                                        setTimeout(function(){
                                            reclameAqui.query(details.url, result);
                                        },250);
                                    }

                                    break;
                                default:
                                    reclamaAquiVerifier = false;
                                    iframe.src = "";
                                    console.log("A Empresa " + result + " Não está cadastrada no ReclameAqui");
                                    callback(null, result);

                                    break;
                            }
                        });
                    }
                },
                function(err, result){
                    if(err !== null){
                        throw err;
                    }

                    console.log(result);
                    if(result.procon || typeof result.reclameAqui === "object" || result.tabId){
                        result.type = "ui";
                        result.url = func.cleanUrl(details.url);

                        chrome.pageAction.show(result.tabId);
                        tabs[result.tabId] = result;
                    }
                }
            );
        }
    }

    console.log("Start Extension...");
    //Event Registration
    chrome.webNavigation.onBeforeNavigate.addListener(onPageLoad, {
        schemes: ["http", "https"]
    });

    chrome.runtime.onConnect.addListener(
        function(port) {
            if(port.name === "popup"){
                console.log("port established");

                port.onMessage.addListener(
                    function(msg){
                        switch (msg.type){
                            case "ui":
                                chrome.tabs.query(
                                    {
                                        active: true
                                    },
                                    function(activeTabs){
                                        port.postMessage(tabs[activeTabs[0].id]);
                                    }
                                );
                                break;
                        }
                    }
                );
            }
        }
    );
})();