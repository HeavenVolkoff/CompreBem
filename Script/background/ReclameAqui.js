/**
 * Created by Vitor Augusto da Silva Vasconcellos on 9/13/15.
 */

var func = require("./functions.js");
var url = require("url");

/*
 *  Rest Api Map
 *
 *  URL: http://ws04.reclameaqui.com.br/reclameaqui-api-empresa/rest/empresa/{id}
 *  id: ID
 *  ct: (????)
 *  pr: Tempo desde a ultima avaliação (const: 12 meses)
 *  nm: Nome da Empresa
 *  rc: Numero de Reclamacaoes
 *  ps: Porcentagem de Problemas Solucionados
 *  tm: Tempo Medio de Resposta
 *  nt: Nota Medio do Consumidor
 *  sl:{
 *      0 => Em Analise
 *      1 => RA1000 (a.k.a Expetacular)
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
function ReclameAqui(){} //TODO: implement DB for most common sites

Object.defineProperties(ReclameAqui, {
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

module.exports = ReclameAqui;

window.ReclameAqui = ReclameAqui;

ReclameAqui.prototype.query = function query(url, callback){
    "use strict";

    callback = typeof callback === "function"? callback : function(){};
    var self = this;

    var downloadUnsuccessful = function downloadUnsuccessful(){
        callback(new Error("Failed to download, Request Status: " + this.statusText));
    };

    var queryURLSuccessful = function queryURLSuccessful(){
        var element = this.response.querySelector(".btn-tudo-sobre-empresa");

        if(element) {
            var enterpriseUrl = element.attributes[0].value;

            var queryEnterpriseURLSuccessful = function queryEnterpriseURLSuccessful(){
                var siteUrl = this.response.querySelector(".lista-info-company");

                if(siteUrl && siteUrl.children.length > 0){
                    siteUrl = siteUrl.children[1].children[0].innerHTML;

                    if(siteUrl.indexOf(url) !== -1){
                        var queryEnterpriseJSONSuccessful = function queryEnterpriseJSONSuccessful(){
                            var enterpriseJSON = this.response;
                            enterpriseJSON.ps =  Number(enterpriseJSON.ps.split(",").join(".")); //Fix wrong number format
                            callback(null, enterpriseJSON);
                        };

                        func.download().url(ReclameAqui.restIdUrl + enterpriseUrl.split("/")[4])//id
                            .type("json")
                            .success(queryEnterpriseJSONSuccessful)
                            .error(downloadUnsuccessful)
                            .abort(downloadUnsuccessful)
                            .done();

                        return;
                    }
                }

                callback(null, null);
            };

            func.download().url(enterpriseUrl)
                .type("document")
                .success(queryEnterpriseURLSuccessful)
                .error(downloadUnsuccessful)
                .abort(downloadUnsuccessful)
                .done();
        }else{
            if(this.response.querySelector("meta[http-equiv=CacheControl]")){
                callback(null, callback);
                return;
            }

            callback(null, null);
        }
    };

    func.download().url(ReclameAqui.queryUrl+url)
        .type("document")
        .success(queryURLSuccessful)
        .error(downloadUnsuccessful)
        .abort(downloadUnsuccessful)
        .done();
};