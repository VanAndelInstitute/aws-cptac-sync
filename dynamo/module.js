'use strict';

const AWS = require('aws-sdk');

const docClient  = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

var dynamoModule = (function() {
    function checkReceipt(shipmentId, lastModified) {
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

    return {
        getLatest: function(topic) {
            return new Promise(async (resolve, reject) => {
                var lastUpdated = await docClient.get({
                    TableName: process.env.LATEST_RECORD,
                    Key: { topic: topic }
                }).promise();
                if (Object.entries(lastUpdated).length === 0 && lastUpdated.constructor === Object) {
                    resolve({topic: topic, lastModified: '01-01-2019 00:00:00.000'});
                } else {
                    resolve(lastUpdated.Item);
                }
            });
        },

        filterReceipts: function(shipments) {
            return new Promise(async (resolve, reject) => {
                var promises = [];
                shipments.forEach(shipment => {
                    promises.push(checkReceipt(shipment[0], shipment[1]));
                });
                Promise.all(promises)
                .then(receipts => {
                    resolve([].concat.apply([], receipts.filter(receipt => receipt)));
                });
            });
        },

        updateReceipt: function(shipment) {
            return docClient.put({
                TableName: process.env.BSI_RECEIPTS,
                Item: shipment
            }).promise();
        },

        getReceipt: function(shipmentId) {
            return docClient.get({
                TableName: process.env.BSI_RECEIPTS,
                Key: { shipmentId: shipmentId }
            }).promise();
        },

        updateLatest: function(lastUpdated) {
            return docClient.put({
                TableName: process.env.LATEST_RECORD,
                Item: lastUpdated
            }).promise();
        }
    };
})();

module.exports = dynamoModule;