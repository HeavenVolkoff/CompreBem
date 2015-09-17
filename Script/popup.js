/**
 * Created by Vítor Augusto da Silva Vasconcellos  on 9/17/15.
 */

chrome.runtime.onMessage.addListener(
    function(msg, _, sendResponse){
        "use strict";

        switch (msg.type){
            case "result":
                console.log(msg);
                sendResponse();
                break;
        }
    }
);