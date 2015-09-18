/**
 * Created by Vítor Augusto da Silva Vasconcellos  on 9/17/15.
 */

var port = chrome.runtime.connect({name: "popup"});

port.onMessage.addListener(
    function(msg){
        "use strict";
        switch (msg.type){
            case "ui":
                setupUI(msg.procon, msg.reclameAqui);

                console.log(msg);
                break;
        }
    }
);
port.postMessage({type: "ui"});

function setupUI(procon, reclameAqui){
    "use strict";
    var reputationImg = [
        ["icon-baffled", "Em Análise"],
        ["icon-checkmark", "RA1000"],
        ["icon-grin", "Ótimo"],
        ["icon-smile", "Bom"],
        ["icon-wondering", "Regular"],
        ["icon-sad", "Ruim"],
        ["icon-frustrated", "Não Recomendado"],
        ["icon-question", "Desconhecida"]
    ];

    document.querySelector("#title").innerText = reclameAqui.nm;
    document.querySelector("#grade").innerText = reclameAqui.nt;
    document.querySelector("#answerTime").innerText = reclameAqui.tm;
    document.querySelector("#complaints").innerText = reclameAqui.rc;
    var reputationIcon = document.querySelector("#reputationIcon");
        reputationIcon.className = reputationIcon.className + " " + reputationImg[reclameAqui.sl][0];
    document.querySelector("#reputation").innerText = reputationImg[reclameAqui.sl][1];
    setTimeout(function(){
        document.querySelector("#solvedProblems").contentWindow.postMessage(
            {
                command: 'render',
                percentage: reclameAqui.ps
            }, '*'
        );
    }, 200);
}