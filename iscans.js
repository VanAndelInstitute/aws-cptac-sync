'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const request = require('request');
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

var iscansModule = (() => {
    function getCdrSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.CDR_SECRET}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        });
    }
    
    function createCdrRequest(iscan) {
        return new Promise((resolve, reject) => {
            getCdrSecrets().then(data => {
                var secrets = JSON.parse(data.SecretString);
                request({
                    uri: process.env.CDR_BASE_URL + 'iscanEvent/' + iscan.caseId,
                    method: 'POST',
                    body: iscan,
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
                    var iscan = await bsi.iscans.get(bsiCases[index]);
                    if (iscan) {
                        await dynamo.iscans.update(iscan);
                    }
                }
    
                await dynamo.updateLatest(lastUpdated);
                await bsi.logoff();
                resolve();
            });
        },

        sync: async (iscan) => {
            var statusCode = await createCdrRequest(iscan);
            
            await dynamo.iscans.updateSync({
                caseId: iscan.caseId,
                lastModified: iscan.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.iscans.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.iscans.getSync(caseId);
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var iscan = await bsi.iscans.get(caseId);
            await dynamo.iscans.update(iscan);
            await bsi.logoff();
        }
    };
})();

module.exports = iscansModule;