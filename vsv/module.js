'use strict';

const config = require('./config');
const request = require('request');
const aws4  = require('aws4')
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

const vsvModule = (() => {
    function getVsvSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.VSV_SECRET}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        });
    }

    return {
        images: {
            getUpdated: () => {
                return new Promise((resolve, reject) => {
                    request(aws4.sign({
                        host: config.uri.host,
                        path: config.uri.getUpdated,
                        url: 'https://' + config.uri.host + config.uri.getUpdated,
                        uri: 'https://' + config.uri.host + config.uri.getUpdated,
                        method: 'GET'
                    },
                    JSON.parse(secrets.SecretString)),
                    (error, response, body) => {
                        if (!error && response.statusCode == 200) {
                            resolve(JSON.parse(body).data);
                        }
                        else if (error) {
                            reject(error);
                        }
                        else {
                            reject(body);
                        }
                    });
                });
            },

            getUpdatedCase: async (caseId) => {
                return new Promise((resolve, reject) => {
                    getVsvSecrets().then(secrets =>
                        request(aws4.sign({
                            host: config.uri.host,
                            path: config.uri.getUpdated + caseId,
                            url: 'https://' + config.uri.host + config.uri.getUpdated + caseId,
                            uri: 'https://' + config.uri.host + config.uri.getUpdated + caseId,
                            method: 'GET'
                        },
                        JSON.parse(secrets.SecretString)),
                        (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                resolve(JSON.parse(body));
                            }
                            else if (error) {
                                reject(error);
                            }
                            else {
                                reject(body);
                            }
                        })
                    );
                });
            },

            clearCase: (caseId, lastModified) => {
                return new Promise((resolve, reject) => {
                    getVsvSecrets().then(secrets =>
                        request(aws4.sign({
                            host: config.uri.host,
                            path: config.uri.deleteCaseJournal + caseId,
                            url: 'https://' + config.uri.host + config.uri.deleteCaseJournal + caseId,
                            uri: 'https://' + config.uri.host + config.uri.deleteCaseJournal + caseId,
                            method: 'GET'
                        },
                        JSON.parse(secrets.SecretString)),
                        (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                resolve(JSON.parse(body));
                            }
                            else if (error) {
                                reject(error);
                            }
                            else {
                                reject(body);
                            }
                        })
                    );
                });
            }
        }
    };
})();

module.exports = vsvModule;