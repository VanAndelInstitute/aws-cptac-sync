'use strict';

import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const docClient  = DynamoDBDocument.from(new DynamoDB({ convertEmptyValues: true }));

var dynamoModule = (() => {    
    var receipt = {
        check: async (shipmentId, lastModified) => {
            var receipt = await docClient.get({
                TableName: process.env.BSI_RECEIPTS,
                Key: {
                    'shipmentId': shipmentId
                },
                AttributesToGet: ['shipmentId', 'lastModified']
            });
            if (!receipt.Item) {
                return shipmentId;
            } else if (receipt.Item.lastModified != lastModified.replace(' ', 'T')) {
                return shipmentId;
            }
        }
    }

    return {
        toJson: (input) => {
            return unmarshall(input, { convertEmptyValues: true });
        },

        getLatest: async (topic) => {
            var lastUpdated = await docClient.get({
                TableName: process.env.LATEST_RECORD,
                Key: { topic: topic }
            });
            if (!lastUpdated.Item) {
                return {topic: topic, lastModified: '02-01-2020 00:00:00.000'};
            } else {
                return lastUpdated.Item;
            }
        },

        updateLatest: async (lastUpdated) => {
            return docClient.put({
                TableName: process.env.LATEST_RECORD,
                Item: lastUpdated
            });
        },

        receipts: {
            filter: async (shipments) => {
                let receipts = await Promise.all(
                    shipments.map(shipment => 
                        receipt.check(shipment[0], shipment[1])
                ));
                return receipts.filter(receipt => receipt);
            },

            update: async (shipment) => {
                return docClient.put({
                    TableName: process.env.BSI_RECEIPTS,
                    Item: shipment
                });
            },

            get: async (shipmentId) => {
                return docClient.get({
                    TableName: process.env.BSI_RECEIPTS,
                    Key: { shipmentId: shipmentId }
                });
            },

            getSync: async (shipmentId) => {
                return docClient.get({
                    TableName: process.env.BSI_RECEIPTS_SYNC,
                    Key: { shipmentId: shipmentId }
                });
            },

            updateSync: async (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_RECEIPTS_SYNC,
                    Item: syncData
                });
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
                    });
                // }
                // else {
                //     console.log(molecularqc.caseId + " was not updated.")
                // }
            },

            get: async (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_MOLECULARQCS,
                    Key: { caseId: caseId }
                });
            },

            getSync: async (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_MOLECULARQCS_SYNC,
                    Key: { caseId: caseId }
                });
            },

            updateSync: async (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_MOLECULARQCS_SYNC,
                    Item: syncData
                });
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
                    });
                //}
            },

            get: async (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_ISCANS,
                    Key: { caseId: caseId }
                });
            },

            getSync: async (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_ISCANS_SYNC,
                    Key: { caseId: caseId }
                });
            },

            updateSync: async (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_ISCANS_SYNC,
                    Item: syncData
                });
            }
        },

        proteins: {
            update: async (iscan) => {
                return docClient.put({
                    TableName: process.env.BSI_PROTEINS,
                    Item: iscan
                });
            },

            get: async (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_PROTEINS,
                    Key: { caseId: caseId }
                });
            },

            getSync: async (caseId) => {
                return docClient.get({
                    TableName: process.env.BSI_PROTEINS_SYNC,
                    Key: { caseId: caseId }
                });
            },

            updateSync: async (syncData) => {
                return docClient.put({
                    TableName: process.env.BSI_PROTEINS_SYNC,
                    Item: syncData
                });
            }
        },
    };
})();

export default dynamoModule;