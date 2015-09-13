/**
 * Created by Vitor Augusto da Silva Vasconcellos on 9/13/15.
 */

var func = require("./functions.js");

/*
 *  Rest Api Map
 *
 *  URL: http://ws04.reclameaqui.com.br/reclameaqui-api-empresa/rest/empresa/{id}
 *  id: ID
 *  ct: (????)
 *  pr: Tempo (????)
 *  nm: Nome da Empresa
 *  rc: Numero de Reclamacaoes
 *  ps: Porcentagem de Problemas Solucionados
 *  tm: Tempo Medio de Resposta
 *  nt: Nota Medio do Consumidor
 *  sl:{
 *      0 => Em Analise
 *      1 => undefined
 *      2 => Otimo
 *      3 => Bom
 *      4 => Regular
 *      5 => Ruim
 *      6 => Nao Recomendado
 *      7 => Sem Indice
 *  }
 *
 *  URL: http://ws04.reclameaqui.com.br/reclameaqui-api-empresa/rest/empresa/vermais?q={nomeDaEmpresa}&s={NumeroDaPosicaoNaLista}
 *
 *  URL: http://ws04.reclameaqui.com.br/reclameaqui-api-empresa/rest/empresa/autocomplete/?q={NomeDaEmpresaAPesquisar}
 */
function ReclameAqui(){
    "use strict";

    Object.defineProperties(this, {
        queryUrl: {
            writable: false,
            enumerable: true,
            value: "http://www.reclameaqui.com.br/busca/?q="
        },
        restIdUrl: {
            writable: false,
            enumerable: true,
            value: "http://ws04.reclameaqui.com.br/reclameaqui-api-empresa/rest/empresa/"
        }
    });
}

module.exports = ReclameAqui;

window.ReclameAqui = ReclameAqui;

ReclameAqui.prototype.query = function query(name, callback){
    "use strict";

    callback = typeof callback === "function"? callback : function(){};
    var self = this;

    var downloadUnsuccessful = function downloadUnsuccessful(){
        callback(new Error("Failed to download, Request Status: " + this.statusText));
    };

    var downloadSuccessful = function downloadSuccessful(){
        var element = this.response.querySelector(".btn-tudo-sobre-empresa");
        if(element) {
            var enterpriseUrl = element.attributes[0].value;
            var downloadSuccessfulVerify = function downloadSuccessfulVerify(){
                var siteUrl = this.response.querySelector(".lista-info-company");
                if(siteUrl && siteUrl.children.length > 2){
                    siteUrl = siteUrl.children[1].children[0].attributes[0].value;
                    var schemeIdentPos = siteUrl.indexOf('://');
                    if(schemeIdentPos !== -1){
                        siteUrl = siteUrl.substr(schemeIdentPos + 3);
                    }
                    if(siteUrl === name){
                        self.queryId(enterpriseUrl.split("/")[4], callback);
                        return;
                    }
                }

                callback(null, null);
            };

            func.download().url(enterpriseUrl)
                .type("document")
                .success(downloadSuccessfulVerify)
                .error(downloadUnsuccessful)
                .abort(downloadUnsuccessful)
                .done();
        }else{
            callback(null, null);
        }
    };

    func.download().url(this.queryUrl+name)
        .type("document")
        .success(downloadSuccessful)
        .error(downloadUnsuccessful)
        .abort(downloadUnsuccessful)
        .done();
};

ReclameAqui.prototype.queryId = function queryId(id, callback){
    "use strict";

    var downloadSuccessful = function downloadSuccessful(){
        callback(null, this.response);
    };

    var downloadUnsuccessful = function downloadUnsuccessful(){
        callback(new Error("Failed to download, Request Status: " + this.statusText));
    };

    func.download().url(this.restIdUrl+id)
        .type("json")
        .success(downloadSuccessful)
        .error(downloadUnsuccessful)
        .abort(downloadUnsuccessful)
        .done();
}