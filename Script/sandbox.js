/**
 * Created by Heaven Volkoff on 17/09/2015.
 */

var solvedProblems = new Chart(document.querySelector("#solvedProblems").getContext("2d"));

// Set up message event handler:
window.addEventListener('message', function(event) {
    "use strict";

    console.log(event.data.percentage);
    var command = event.data.command;
    var percentage = event.data.percentage;
    switch(command) {
        case 'render':
            solvedProblems.Pie([
                {
                    value: 100 - percentage,
                    color: "#EEEEEE",
                    highlight: "#f3f3f3",
                    label: null
                },
                {
                    value: percentage,
                    color: "#6897CB",
                    highlight: "#8ab5e2",
                    label: "Solucionados"
                }
            ]);
            break;
    }
});