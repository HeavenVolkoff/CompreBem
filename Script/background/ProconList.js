/**
 * Created by Vítor Augusto da Silva Vasconcellos on 9/11/15.
 */

var async = require("Async");
var func = require("./functions.js");
var Dexie = require("dexie");

function ProconList(){
    "use strict";

    var self = this;

    var lastUpdate = localStorage.proconListLastUpdate;
    var controlLength = localStorage.proconControlLength;
    var updateDelayTime = typeof isNaN(localStorage.updateDelayTime)? 604800000 : localStorage.updateDelayTime; //Default to one Week

    Object.defineProperties(this, {
        lastUpdate: {
            get: function(){
                return lastUpdate;
            },
            set: function(val){
                lastUpdate = val;
                localStorage.proconListLastUpdate = val;
            }
        },
        controlLength: {
            get: function(){
                return controlLength;
            },
            set: function(val){
                controlLength = val;
                localStorage.proconControlLength = val;
            }
        },
        UpdateDelayTime: {
            get: function(){
                return updateDelayTime;
            },
            set: function(val){
                updateDelayTime = val;
                localStorage.updateDelayTime = val;
            }
        },
        Url: {
            enumerable: true,
            writable: false,
            value: "http://sistemas.procon.sp.gov.br/evitesite/list/evitesite.php?action=list&jtStartIndex=0&jtPageSize=600&jtSorting=dtInclusao%20DESC"
        },
        dbName: {
            enumerable: true,
            writable: false,
            value: "ProconList"
        }
    });

    this.db = new Dexie(self.dbName);
    this.db.version(1).stores({
        webSites: "url, date"
    });
    this.db.open().then(function(){
        if(typeof self.lastUpdate === "undefined") {
            self.createDB();
        }else {
            self.update();
        }
    });
}

module.exports = ProconList;

ProconList.prototype.createDB = function createDB(){
    "use strict";

    console.log("Creating DB...");

    var self = this;

    var downloadFailed = function updateFailed(){
        throw new Error("List Creation Failed, aborting application, Request Status: " + this.statusText);
    };

    var downloadSuccessful = function downloadSuccessful(){
        self.lastUpdate = Date.now();
        self.controlLength =  this.response.length;


        async.each(
            JSON.parse(this.response).Records,
            function(site, callback){
                self.db.webSites.put({
                    date: new Date(site.dtInclusao.split("/").reverse().join("/")),
                    cnpj: site.strCNPJ,
                    name: site.strEmpresa,
                    url: site.strSite
                }).then(callback);
            },
            function(){
                console.log("DB Created...");
            }
        );
    };

    func.download().url(this.Url).success(downloadSuccessful).error(downloadFailed).abort(downloadFailed).done();
};

ProconList.prototype.update = function update(){
    "use strict";

    var now = Date.now();

    if((this.lastUpdate - now) >= this.UpdateDelayTime){

        var self = this;

        var downloadSuccess = function updateSuccess(){
            if(self.controlLength !== this.response.length) {
                console.log("Need Update...");

                self.updateDB(JSON.parse(this.response).Records);
                self.controlLength = this.response.length;
            }else{
                console.log("Don't Need Update...");
            }

            self.lastUpdate = now;
        };

        var downloadFailed = function updateFailed(){
            console.error("List Update Failed, Request Status: " + this.statusText);
        };

        func.download().url(this.Url).success(downloadSuccess).error(downloadFailed).abort(downloadFailed).done();
    }else{
        console.log("Don't Need Update...");
    }
};

ProconList.prototype.updateDB = function updateDB(list){
    "use strict";

    console.log("Updating DB...");

    var self = this;

    this.db.webSites.orderBy("date").last(
        function(last){
            async.each(
                list,
                function(item, callback){
                    var date = new Date(item.dtInclusao.split("/").reverse().join("/"));

                    if(last.date < date){
                        console.log("New Item Found, Adding to DB...");

                        self.db.webSites.put({
                            date: date,
                            cnpj: item.strCNPJ,
                            name: item.strEmpresa,
                            url: item.strSite
                        }).then(callback);
                    }else{
                        callback();
                    }
                },
                function(){
                    console.log("DB Updated...");
                }
            );
        }
    );
};

ProconList.prototype.exists = function exists(name, callback){
    "use strict";

    var schemeIdentPos = name.indexOf('://');
    name = name.substr(/:\/\/www/.test(name)? schemeIdentPos + 7 : schemeIdentPos !== -1 ? schemeIdentPos + 3 : /^www./.test(name)? 4 : 0).split("/")[0];

    this.db.webSites
        .where("url")
        .equalsIgnoreCase(name)
        .count()
        .then(function(count){
            callback(null, name, !!count);
        }).catch(function(error){
            callback(error, name);
        });
};