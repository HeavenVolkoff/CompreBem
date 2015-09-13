/**
 * Created by Vítor Augusto da Silva Vasconcellos on 9/13/15.
 */

module.exports.download = function download(){
    "use strict";

    return {
        _type: "text",
        type: function(type){
            this._type = typeof type === "string"? type : this._type;
            return this;
        },
        _method: "GET",
        method: function(method){
            this._method = typeof method === "string"? method : this._method;
            return this;
        },
        _url: "",
        url: function(url){
            this._url = typeof url === "string"? url : this._url;
            return this;
        },
        request: new XMLHttpRequest(),
        _success: function(){},
        success: function(callback){
            this._success = typeof callback === "function"? callback : this._success;
            return this;
        },
        _error: function(){},
        error: function(callback){
            this._error = typeof callback === "function"? callback : this._error;
            return this;
        },
        _abort: function(){},
        abort: function(callback){
            this._abort = typeof callback === "function"? callback : this._abort;
            return this;
        },
        done: function(){
            console.log("Downloading: " + this._url);

            this.request.addEventListener("load", this._success);
            this.request.addEventListener("error", this._error);
            this.request.addEventListener("abort", this._abort);

            this.request.open(this._method, this._url, true);
            this.request.responseType = this._type;
            this.request.send();
        }
    };
};