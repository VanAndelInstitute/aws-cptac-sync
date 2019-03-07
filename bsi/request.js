'use strict';

const config = require('./config');
const request = require('request');
const dateformat = require('dateformat');
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

const bsiRequestModule = (function() {
    var sessionId;

    function getBsiSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: "bsi-cptac-service"}, function(err, data) {
                err ? reject(err) : resolve(data);
            });
        });
    }

    function createBsiRequest(uri) {
        return new Promise((resolve, reject) => {
            request({
                uri: uri,
                method: 'GET',
                headers: {
                    'BSI-SESSION-ID': sessionId
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(JSON.parse(body));
                }
                else if (error) {
                    reject(JSON.parse(error));
                }
                else {
                    reject(body);
                }
            });
        });
    }

    return {
        login: function() {
            return new Promise((resolve, reject) => {
                getBsiSecrets().then(data => {
                    request({
                        uri: config.uri.login,
                        method: 'POST',
                        form: JSON.parse(data.SecretString)
                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            sessionId = body;
                            resolve();
                        } else {
                            reject(error ? error : body);
                        }
                    });
                });
            });
        },

        getNewReceipts: function(lastModified) {
            lastModified = dateformat(lastModified, 'mm%2Fdd%2Fyyyy%20HH%3AMM');
            return createBsiRequest(config.uri.getModifiedShipments.replace('%lastModified%', lastModified));
        },

        getReceipt: function(shipmentId) {
            return createBsiRequest(config.uri.getShipmentById.replace('%shipmentId%', shipmentId));
        },

        getTableMetadata: function(table) {
            return createBsiRequest(config.uri.fields.replace('%tablename%', table));
        },

        logoff: function() {
            return new Promise((resolve, reject) => {
                request({
                    uri: config.uri.logoff,
                    method: 'POST',
                    headers: { "BSI-SESSION-ID": sessionId }
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        resolve();
                    } else {
                        reject(error ? error : body);
                    }
                });
            });
        }
    };
})();

module.exports = bsiRequestModule;