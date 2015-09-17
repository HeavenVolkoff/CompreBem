/**
 * Created by Vítor Augusto da Silva Vasconcellos  on 9/17/15.
 */

chrome.runtime.onMessage.addListener(
    function(msg, _, sendResponse){
        "use strict";

        if(msg.iframe){
            console.log("Mesage arrived");
            var iframe = document.createElement('iframe');
            iframe.setAttribute("src", msg.url);
            iframe.setAttribute("style", "display: none");
            document.body.appendChild(iframe);
            sendResponse();
        }
    }
);