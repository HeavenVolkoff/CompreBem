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

(function(){
    "use strict";

    var reclamaAquiVerifier = false;
    var proconList = global.proconList = new ProconList();
    var reclameAqui = global.reclameaqui = new ReclameAqui();
    var tabs = {};

    function onPageLoad(details){
        if(details.frameId === 0){
            async.parallel(
                {
                    processId: function(callback){
                        chrome.tabs.get(
                            details.tabId,
                            function(){
                                if(chrome.runtime.lastError){
                                    console.log("Tab don't Exists, wait...");
                                    chrome.webNavigation.onTabReplaced.addListener(
                                        function tabReplace(){
                                            chrome.webNavigation.onTabReplaced.removeListener(tabReplace);
                                            callback();
                                        }
                                    );
                                }else{
                                    console.log("Tab exists, go");
                                    callback();
                                }
                            }
                        );
                    },
                    result: function(callback){
                        async.parallel(
                            {
                                procon: function(callback){
                                    proconList.exists(details.url, function(err, name, exists){
                                        if(err !== null){
                                            console.log("Error ao verificar lista do procon");
                                            callback(err);
                                        }

                                        console.log(name + (exists? " está contido na lista do Procon, e não é recomendado" : " não está contido na lista do Procon"));
                                        callback(null, exists);
                                    });
                                },

                                reclameAqui: function(callback){ //TODO: remake using switch
                                    reclameAqui.query(details.url, function(err, result){
                                        if(err !== null){
                                            console.log("Error ao verificar empresa no Reclame Aqui");
                                            callback(err);

                                        }else if(typeof result === "object"){
                                            result.ps =  Number(result.ps.split(",").join(".")); //Fix wrong number format
                                            reclamaAquiVerifier = false;
                                            callback(null, result);

                                        }else if(typeof result === "function"){

                                            if(!reclamaAquiVerifier){
                                                console.log("Can't reach ReclameAqui, appending iframe and trying again...");
                                                reclamaAquiVerifier = true;

                                                var iframe = document.createElement('iframe');
                                                iframe.setAttribute("src", ReclameAqui.queryUrl);
                                                iframe.setAttribute("style", "display: none");
                                                document.body.appendChild(iframe);

                                                setTimeout(function(){
                                                    console.log("Response arrived");
                                                    reclameAqui.query(details.url, result);
                                                },250);

                                            }else{
                                                console.log("Trying again...");
                                                setTimeout(function(){
                                                    reclameAqui.query(details.url, result);
                                                },250);
                                            }

                                        }else{
                                            reclamaAquiVerifier = false;
                                            console.log("A Empresa " + result + " Não está cadastrada no ReclameAqui");
                                            callback(null, result);
                                        }
                                    });
                                }
                            },
                            function(err, result){
                                callback(err, result);
                            }
                        );
                    }
                },
                function(err, result){
                    if(err !== null){
                        throw err;
                    }

                    console.log(result);
                    if(result.result.procon || typeof result.result.reclameAqui === "object"){
                        result.result.type = "ui";

                        try{
                            chrome.pageAction.show(details.tabId);
                            tabs[details.tabId] = result.result;

                        }catch(err){
                            console.log("Tab don't Exists again, wait...");
                            chrome.webNavigation.onTabReplaced.addListener(
                                function tabReplace(){
                                    chrome.webNavigation.onTabReplaced.removeListener(tabReplace);
                                    chrome.pageAction.show(details.tabId);
                                    tabs[details.tabId] = result.result;
                                }
                            );
                        }
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
                                chrome.tabs.getSelected(function(tab){
                                    port.postMessage(tabs[tab.id]);
                                });
                                break;
                        }
                    }
                );
            }
        }
    );
})();