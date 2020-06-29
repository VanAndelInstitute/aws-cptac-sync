'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const request = require('request');
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

var proteinsModule = (() => {
    function getCdrSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.CDR_SECRET}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        });
    }
    
    function createCdrRequest(protiens) {
        return new Promise((resolve, reject) => {
            getCdrSecrets().then(data => {
                var secrets = JSON.parse(data.SecretString);
                request({
                    uri: process.env.CDR_BASE_URL + 'proteinEvent/' + protiens.caseId,
                    method: 'POST',
                    body: protiens,
                    json: true,
                    auth: {
                        'user': secrets.username,
                        'pass': secrets.password
                    }
                }, async (error, response, body) => {
                    resolve(response.statusCode);
                });
            });
        });
    }

    return {
        pullRecentChanges: async () => {
            return new Promise(async (resolve, reject) => {
                await bsi.login();
                
                var lastUpdated = await dynamo.getLatest('Case');
                var bsiCases = await bsi.cases.getUpdated(lastUpdated.lastModified);
    
                for (let index = 0; index < bsiCases.length; index++) {
                    var protein = await bsi.protiens.get(bsiCases[index]);
                    if (protein) {
                        await dynamo.protiens.update(protein);
                    }
                }
    
                await dynamo.updateLatest(lastUpdated);
                await bsi.logoff();
                resolve();
            });
        },

        sync: async (protein) => {
            console.log("Syncing " + protein.caseId + " to CDR.");
            var lastModified = protein.lastModified;
            delete protein.lastModified;
            var statusCode = await createCdrRequest(protein);
            
            console.log("Recording status code " + statusCode + ".");
            await dynamo.proteins.updateSync({
                caseId: protein.caseId,
                lastModified: lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.proteins.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.proteins.getSync(caseId);
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var protein = await bsi.proteins.get(caseId);
            await dynamo.proteins.update(protein);
            await bsi.logoff();
        }
    };
})();

module.exports = proteinsModule;