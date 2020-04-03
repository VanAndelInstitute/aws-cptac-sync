'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const request = require('request');
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

var molecularqcsModule = (() => {
    function getCdrSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.CDR_SECRET}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        });
    }
    
    function createCdrRequest(molecularqc) {
        return new Promise((resolve, reject) => {
            getCdrSecrets().then(data => {
                var secrets = JSON.parse(data.SecretString);
                request({
                    uri: process.env.CDR_BASE_URL + 'molecularQCEvent/' + molecularqc.caseId,
                    method: 'POST',
                    body: molecularqc,
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
                    var molecularqc = await bsi.molecularqcs.get(bsiCases[index]);
                    await dynamo.molecularqcs.update(molecularqc);
                }

                await dynamo.updateLatest(lastUpdated);
                await bsi.logoff();
                resolve();
            });
        },

        sync: async (molecularqc) => {
            console.log("Syncing " + molecularqc.caseId + " to CDR.");
            var lastModified = molecularqc.lastModified;
            delete molecularqc.lastModified;
            var statusCode = await createCdrRequest(molecularqc);

            console.log("Recording status code " + statusCode + ".");
            await dynamo.molecularqcs.updateSync({
                caseId: molecularqc.caseId,
                lastModified: lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.molecularqcs.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.molecularqcs.getSync(caseId);
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var molecularqc = await bsi.molecularqcs.get(caseId);
            await dynamo.molecularqcs.update(molecularqc);
            await bsi.logoff();
        }
    };
})();

module.exports = molecularqcsModule;