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
    var reclamaAquiVerifierFlag = false;
    var proconList = global.proconList = new ProconList();
    var reclameAqui = global.reclameaqui = new ReclameAqui();
    var sites = {};
    var tabs = {};

    function onTabUpdated(tabId, changeInfo, tab){
        if(changeInfo.status === "complete" && /^(http|https):\/\//.test(tab.url)){
            console.assert(tabId === tab.id, "Id's das tabs sao diferentes");
            var site = sites[func.cleanUrl(tab.url)];
            var tabFlag = false;
            if(!site){
                throw new Error("Inconsistency Error, not found reference to site: " + func.cleanUrl(tab.url));
            }

            site.currentTabsId.forEach(
                function(siteTabId){
                    if(siteTabId === tabId){
                        tabFlag = true;
                    }
                }
            );
            if(!tabFlag){
                site.currentTabsId.push(tabId);
                
                var siteFromTabs = tabs[tabId];
                if(siteFromTabs){
                    for(var i = 0; i < siteFromTabs.currentTabsId.length; i++){
                        if(siteFromTabs.currentTabsId[i] === tabId){
                            siteFromTabs.currentTabsId.splice(i, 1);
                            break;
                        }
                    }

                    if(!siteFromTabs.currentTabsId.length){
                        delete sites[siteFromTabs.url];
                    }
                }

                tabs[tabId] = site;
            }

            async.whilst(
                function(){
                    return site.status !== "complete";
                },
                function(callback){
                    async.nextTick(callback);
                },
                function(){
                    if(site.procon || site.reclameAqui){
                        chrome.pageAction.show(tabId);
                    }
                }
            );
        }
    }

    function onTabRemoved(tabId){
        var site = tabs[tabId];

        if(site){
            delete tabs[tabId];

            for(var i = 0; i < site.currentTabsId.length; i++){
                if(site.currentTabsId[i] === tabId){
                    site.currentTabsId.splice(i, 1);
                    break;
                }
            }

            if(!site.currentTabsId.length){
                delete sites[site.url];
            }
        }
    }

    function onPageLoaded(details){
        if(details.frameId === 0){
            var url = func.cleanUrl(details.url);

            if(sites[url]){
                return;
            }

            var site = sites[url] = {
                url: url,
                status: "loading",
                currentTabsId: []
            };

            async.parallel(
                {
                    /**
                     * Verify if procon has the site in it's list
                     * @param callback
                     */
                    procon: function verifyProcon(callback){
                        proconList.exists(url, callback);
                    },
                    /**
                     * Get website informations from reclameAqui
                     * @param callback
                     */
                    reclameAqui: function getReclameAqui(callback){
                        reclameAqui.query(url, function(err, result){
                            if(err){
                                console.error("Error ao verificar empresa no Reclame Aqui");
                                callback(err);

                            }

                            if(typeof result === "function"){
                                if(!reclamaAquiVerifierFlag){
                                    console.warn("Can't reach ReclameAqui, reloading iframe and trying again...");
                                    reclamaAquiVerifierFlag = true;

                                    iframe.onload = function(){
                                        iframe.onload = null;
                                        console.log("Response arrived");
                                        reclameAqui.query(details.url, result);
                                    };
                                    iframe.src = ReclameAqui.queryUrl;

                                }else{
                                    console.warn("Trying again...");
                                    setTimeout(function(){
                                        reclameAqui.query(details.url, result);
                                    },250);
                                }
                            }else{
                                iframe.src = "";
                                reclamaAquiVerifierFlag = false;
                                callback(null, result);
                            }
                        });
                    }
                },
                function(err, result){
                    if(err){
                        throw err;
                    }

                    console.log(url + ":\n\t" + (result.procon? "" : "Não ") + "Existe na Lista do Procon" + "\n\t" + (result.reclameAqui? "" : "Não ") + "Está Contido no ReclameAqui");

                    site.status = "complete";
                    site.procon = result.procon;
                    site.reclameAqui = result.reclameAqui;
                }
            );
        }
    }

    function onPortConnected(port){
        if(port.name === "popup"){
            port.onMessage.addListener(
                function(msg){
                    switch (msg.type){
                        case "ui":
                            chrome.tabs.query(
                                {
                                    active: true
                                },
                                function(activeTabs){
                                    var site = tabs[activeTabs[0].id];
                                    site.type = "ui";
                                    port.postMessage(site);
                                }
                            );
                            break;
                    }
                }
            );
        }
    }

    console.log("Start Extension...");
    //Event Registration
    chrome.webNavigation.onBeforeNavigate.addListener(onPageLoaded, {schemes: ["http", "https"]});
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onRemoved.addListener(onTabRemoved);
    chrome.runtime.onConnect.addListener(onPortConnected);
})();