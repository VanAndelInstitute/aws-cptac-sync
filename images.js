'use strict';

const dynamo = require('./dynamo/module');
const request = require('request');
const AWS = require('aws-sdk');
const vsv = require('./vsv/module');

const secretClient = new AWS.SecretsManager();

var imagesModule = (() => {
    function getCdrSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.CDR_SECRET}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        });
    }
    
    function createCdrRequest(images) {
        return new Promise((resolve, reject) => {
            getCdrSecrets().then(data => {
                var secrets = JSON.parse(data.SecretString);
                request({
                    uri: process.env.CDR_BASE_URL + 'imageEvent/',
                    method: 'POST',
                    body: images,
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
                var images = await vsv.images.getUpdated();
                console.log(images);

                for (let index = 0; index < images.length; index++) {
                    await dynamo.images.update(images[index]);
                    await vsv.images.clearCase(images[index].CaseId, images[index].ModifiedOn);
                }
                resolve();
            });
        },

        sync: async (image) => {
            console.log("Syncing " + image.CaseId + " to CDR.");
            var statusCode = await createCdrRequest(image);
            
            console.log("Recording status code " + statusCode + ".");
            await dynamo.images.updateSync({
                CaseId: image.CaseId,
                lastModified: image.ModifiedOn,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.images.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.images.getSync(caseId);
        },

        rebuild: async (caseId) => {
            return vsv.images.getUpdatedCase(caseId);
        }
    };
})();

module.exports = imagesModule;