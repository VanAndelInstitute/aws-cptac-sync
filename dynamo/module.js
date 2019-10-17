'use strict';

const AWS = require('aws-sdk');

const docClient  = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

var dynamoModule = (() => {
    var upToDate = (oldValue, newValue) => {
        //Deep copy so deleteing last modified won't effect the original
        oldValue = JSON.parse(JSON.stringify(oldValue));
        newValue = JSON.parse(JSON.stringify(newValue));

        delete oldValue.lastModified;
        delete newValue.lastModified;

        return JSON.stringify(oldValue) == JSON.stringify(newValue);
    }
    
    var receipt = {
        check: (shipmentId, lastModified) => {
            return new Promise(async (resolve, reject) => {
                docClient.get({
                    TableName: process.env.BSI_RECEIPTS,
                    Key: {
                        'shipmentId': shipmentId
                    },
                    AttributesToGet: ['shipmentId', 'lastModified']
                }).promise()
                .then(receipt => {
                    if (Object.entries(receipt).length === 0 && receipt.constructor === Object) {
                        resolve(shipmentId);
                    } else if (receipt.Item.lastModified != lastModified.replace(' ', 'T')) {
                        resolve(shipmentId);
                    }
                    resolve();
                });
            });
        }
    }

    return {
        toJson: (input) => {
            return AWS.DynamoDB.Converter.unmarshall(input, { convertEmptyValues: true });
        },

        getLatest: (topic) => {
            return new Promise(async (resolve, reject) => {
                var lastUpdated = await docClient.get({
                    TableName: process.env.LATEST_RECORD,
                    Key: { topic: topic }
                }).promise();
                if (Object.entries(lastUpdated).length === 0 && lastUpdated.constructor === Object) {
                    resolve({topic: topic, lastModified: '08-29-2019 00:00:00.000'});
                } else {
                    resolve(lastUpdated.Item);
                }
            });
        },

        updateLatest: (lastUpdated) => {
            return docClient.put({
                TableName: process.env.LATEST_RECORD,
                Item: lastUpdated
            }).promise();
        },

        receipts: {
            filter: (shipments) => {
                return new Promise(async (resolve, reject) => {
                    var promises = [];
                    shipments.forEach(shipment => {
                        promises.push(receipt.check(shipment[0], shipment[1]));
                    });
                    Promise.all(promises)
                    .then(receipts => {
                        resolve([].concat.apply([], receipts.filter(receipt => receipt)));
                    });
                });
            },

            update: (shipment) => {
                return docClient.put({
                    TableName: process.env.BSI_RECEIPTS,
                    Item: shipment
                }).promise();
            },

            get: (shipmentId) => {
                return docClient.get({
                    TableName: process.env.BSI_RECEIPTS,
                    Key: { shipmentId: shipmentId }
                }).promise();
            },

            getSync: (shipmentId) => {
                return docClient.get({
                    TableName: process.env.BSI_RECEIPTS_SYNC,
                    Key: { shipmentId: shipmentId }
                }).promise();
            },

            updateSync: (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_RECEIPTS_SYNC,
                    Item: syncData
                }).promise();
            }
        },
        
        molecularqcs: {
            update: async (molecularqc) => {
                if (!upToDate(await module.exports.molecularqcs.get(molecularqc.caseId), molecularqc)) {
                    return docClient.put({
                        TableName: process.env.BSI_MOLECULARQCS,
                        Item: molecularqc
                    }).promise();
                }
            },

            get: (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_MOLECULARQCS,
                    Key: { caseId: caseId }
                }).promise();
            },

            getSync: (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_MOLECULARQCS_SYNC,
                    Key: { caseId: caseId }
                }).promise();
            },

            updateSync: (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_MOLECULARQCS_SYNC,
                    Item: syncData
                }).promise();
            }
        },

        iscans: {
            update: async (iscan) => {
                if (!upToDate(await module.exports.iscans.get(iscan.caseId), iscan)) {
                    return docClient.put({
                        TableName: process.env.BSI_ISCANS,
                        Item: iscan
                    }).promise();
                }
            },

            get: (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_ISCANS,
                    Key: { caseId: caseId }
                }).promise();
            },

            getSync: (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_ISCANS_SYNC,
                    Key: { caseId: caseId }
                }).promise();
            },

            updateSync: (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_ISCANS_SYNC,
                    Item: syncData
                }).promise();
            }
        }
    };
})();

module.exports = dynamoModule;