'use strict';

const config = require('./config');
const request = require('request');
const dateformat = require('dateformat');
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

const bsiRequestModule = (() => {
    var sessionId;

    function getBsiSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.BSI_SECRET}, (err, data) => {
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
            }, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    resolve(JSON.parse(body));
                }
                else if (error) {
                    reject(error);
                }
                else {
                    reject(body);
                }
            });
        });
    }

    return {
        login: () => {
            return new Promise((resolve, reject) => {
                getBsiSecrets().then(data => {
                    request({
                        uri: config.uri.login,
                        method: 'POST',
                        form: JSON.parse(data.SecretString)
                    }, (error, response, body) => {
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

        getTableMetadata: (table) => {
            return createBsiRequest(config.uri.fields.replace('%tablename%', table));
        },

        logoff: () => {
            return new Promise((resolve, reject) => {
                request({
                    uri: config.uri.logoff,
                    method: 'POST',
                    headers: { "BSI-SESSION-ID": sessionId }
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        resolve();
                    } else {
                        reject(error ? error : body);
                    }
                });
            });
        },

        receipts: {
            getUpdated: (lastModified) => {
                lastModified = dateformat(lastModified, 'mm%2Fdd%2Fyyyy%20HH%3AMM');
                return createBsiRequest(config.uri.getModifiedShipments.replace('%lastModified%', lastModified));
            },

            get: (shipmentId) => {
                return createBsiRequest(config.uri.getShipmentById.replace('%shipmentId%', shipmentId));
            }
        },

        cases: {
            getUpdated: (lastModified) => {
                lastModified = dateformat(lastModified, 'mm%2Fdd%2Fyyyy%20HH%3AMM');
                return Promise.all([
                    createBsiRequest(config.uri.getCaseByVialLastModified.replace('%lastModified%', lastModified)),
                    createBsiRequest(config.uri.getCaseBySampleLastModified.replace('%lastModified%', lastModified)),
                    createBsiRequest(config.uri.getCaseBySubjectLastModified.replace('%lastModified%', lastModified))
                ]).then(reports => {
                    let caseIds = [];
                    reports.forEach(report =>
                        report.rows.forEach(results =>
                            results.forEach(caseId => {
                                caseIds.push(caseId);
                            })
                        )
                    );
                    return caseIds.filter((value, index, self) => {return self.indexOf(value) === index;});
                })
                .catch(error => console.log(error));
            },

            get: (caseId) => {
                return Promise.all([createBsiRequest(config.uri.vialReport.replace('%caseId%', caseId)),
                        createBsiRequest(config.uri.pooledReport.replace('%caseId%', caseId))]);
            },
        }
    };
})();

module.exports = bsiRequestModule;