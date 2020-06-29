'use strict';

const AWS = require('aws-sdk');

const docClient  = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

var dynamoModule = (() => {    
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
                    resolve({topic: topic, lastModified: '02-01-2020 00:00:00.000'});
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
            dnaUpToDate: (oldDna, newDna) => {
                if (oldDna == undefined || newDna == undefined)
                {
                    return oldDna == newDna;
                }
                if (oldDna.length != newDna.length) {
                    return false;
                }
                return oldDna.every(oldOne => {
                    var match = newDna.filter(newOne =>
                        newOne.analyteID == oldOne.analyteID &&
                        newOne.dateOfExtraction == oldOne.dateOfExtraction &&
                        newOne.volume == oldOne.volume &&
                        newOne.gelScore == oldOne.gelScore &&
                        newOne.qubit.concentration == oldOne.qubit.concentration &&
                        newOne.nanoDrop.concentration == oldOne.nanoDrop.concentration &&
                        newOne.nanoDrop.a260OverA280 == oldOne.nanoDrop.a260OverA280 &&
                        newOne.nanoDrop.a260OverA230 == oldOne.nanoDrop.a260OverA230 &&
                        newOne.Bioanalyzer.min == oldOne.Bioanalyzer.min &&
                        newOne.Bioanalyzer.avg.lower == oldOne.Bioanalyzer.avg.lower &&
                        newOne.Bioanalyzer.avg.upper == oldOne.Bioanalyzer.avg.upper
                    );
                    
                    return match.length == 1 && match[0].specimenIDs.length == oldOne.specimenIDs.length &&
                        match[0].specimenIDs.every(s => oldOne.specimenIDs.filter(spec => spec.specimenID == s.specimenID).length != 0);
                });
            },

            rnaUpToDate: (oldRna, newRna) => {
                if (oldRna == undefined || newRna == undefined)
                {
                    return oldRna == newRna;
                }
                if (oldRna.length != newRna.length) {
                    return false;
                }
                return oldRna.every(oldOne => {
                var match = newRna.filter(newOne =>
                    newOne.analyteID == oldOne.analyteID &&
                    newOne.dateOfExtraction == oldOne.dateOfExtraction &&
                    newOne.volume == oldOne.volume &&
                    newOne.rinValue == oldOne.rinValue &&
                    newOne.nanoDrop.concentration == oldOne.nanoDrop.concentration &&
                    newOne.nanoDrop.a260OverA280 == oldOne.nanoDrop.a260OverA280 &&
                    newOne.nanoDrop.a260OverA230 == oldOne.nanoDrop.a260OverA230);
                  
                    return match.length == 1 && match[0].specimenIDs.length == oldOne.specimenIDs.length &&
                        match[0].specimenIDs.every(s => oldOne.specimenIDs.filter(spec => spec.specimenID == s.specimenID).length != 0);
                });
            },

            upToDate: (oldValue, newValue) => {
                return module.exports.molecularqcs.dnaUpToDate(oldValue.germlineDNA, newValue.germlineDNA) &&
                    module.exports.molecularqcs.dnaUpToDate(oldValue.normalDNA, newValue.normalDNA) &&
                    module.exports.molecularqcs.rnaUpToDate(oldValue.normalRNA, newValue.normalRNA) &&
                    module.exports.molecularqcs.dnaUpToDate(oldValue.tumorDNA, newValue.tumorDNA) &&
                    module.exports.molecularqcs.rnaUpToDate(oldValue.tumorRNA, newValue.tumorRNA);
            },

            update: async (molecularqc) => {
                // if (!module.exports.molecularqcs.upToDate(await module.exports.molecularqcs.get(molecularqc.caseId), molecularqc)) {
                    return docClient.put({
                        TableName: process.env.BSI_MOLECULARQCS,
                        Item: molecularqc
                    }).promise();
                // }
                // else {
                //     console.log(molecularqc.caseId + " was not updated.")
                // }
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
            upToDate: (oldValue, newValue) => {
                return oldValue.normalTissue.iscanContamination == newValue.normalTissue.iscanContamination &&
                oldValue.normalTissue.iscanMatch == newValue.normalTissue.iscanMatch &&
                oldValue.tumorTissue.iscanContamination == newValue.tumorTissue.iscanContamination &&
                oldValue.tumorTissue.iscanMatch == newValue.tumorTissue.iscanMatch;
            },

            update: async (iscan) => {
                //if (!module.exports.iscans.upToDate(await module.exports.iscans.get(iscan.caseId), iscan)) {
                    return docClient.put({
                        TableName: process.env.BSI_ISCANS,
                        Item: iscan
                    }).promise();
                //}
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
        },

        proteins: {
            update: async (iscan) => {
                return docClient.put({
                    TableName: process.env.BSI_PROTEINS,
                    Item: iscan
                }).promise();
            },

            get: (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_PROTEINS,
                    Key: { caseId: caseId }
                }).promise();
            },

            getSync: (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_PROTEINS_SYNC,
                    Key: { caseId: caseId }
                }).promise();
            },

            updateSync: (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_PROTEINS_SYNC,
                    Item: syncData
                }).promise();
            }
        }
    };
})();

module.exports = dynamoModule;