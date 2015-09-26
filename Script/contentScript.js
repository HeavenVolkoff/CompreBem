/**
 * Created by Vítor Augusto da Silva Vasconcellos on 24/09/2015.
 */

document.addEventListener('DOMContentLoaded', function(){
    "use strict";

    console.log("iframe");

    document.body.addEventListener("load",
        function(){
            var element = document.querySelector(".btn-tudo-sobre-empresa");
            if(element){
                element = element.attributes[0].value;
            }
            console.log(element);

            chrome.runtime.sendMessage(
                {
                    type: "iframe",
                    EnterpriseURL: element
                }
            );
        }
    );
}, false);