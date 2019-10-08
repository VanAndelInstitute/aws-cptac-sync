'use strict';

const config = require('./config');
const bsiRequest = require('./request');

const bsiParseModule = (() => {
    function camelize(str) {
        return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    }

    function filterMetadata(table, fieldsToFilter) {
        return new Promise((resolve, reject) => {
            bsiRequest.getTableMetadata(table)
            .then(fields => {
                var sortedMetadata = [];
                fieldsToFilter.forEach(filterField => {
                    sortedMetadata.push(fields.find(field => filterField == field.name));
                });
                resolve(sortedMetadata);
            });
        });
    }

    var cases = {
        vials: {
            vialMetadata: null,

            parseValue: (value, metadata) => {
                if (metadata.type == 'Date' && value.length > 0) {
                    if (metadata.name == 'vial.date_entered') {
                        return value.replace(' ', 'T');
                    }
                    else {
                        return new Date(value).toISOString();
                    }
                }
                if (metadata.name == 'vial.parent_id') {
                    return value.length > 0 ? [value] : [];
                }
                if (metadata.name == 'vial.field_397' || metadata.name == 'vial.field_398' || metadata.name == 'vial.field_399') {
                    return value.length > 0 ? parseInt(value) : null;
                }
                else {
                    return value;
                }
            },
    
            fetchMetadata: () => {
                var promises = []
                config.vials.Metadata.forEach(metadata => {
                    promises.push(filterMetadata(metadata.table, metadata.fields))
                });
                return Promise.all(promises).then(fields => {
                    cases.vials.vialMetadata = [].concat.apply([], fields);
                });
            },
    
            getMetadata: async () => {
                if (!cases.vials.vialMetadata) {
                    await cases.vials.fetchMetadata();
                }
                return cases.vials.vialMetadata;
            },

            parse: async (results) => {
                var metadata = await cases.vials.getMetadata();
                return new Promise((resolve, reject) => {
                    var parsedResults = [];
                    for (var i = 0; i < results.headers.length; i++) {
                        if (config.vials.fieldNameMap[metadata[i].name] != undefined) {
                            results.headers[i] = config.vials.fieldNameMap[metadata[i].name];
                        } else {
                            results.headers[i] = camelize(results.headers[i]);
                        }
                    };
                    results.rows.forEach(row => {
                        var value = {};
                        for (var i = 0; i < results.headers.length; i++) {
                            value[results.headers[i]] = cases.vials.parseValue(row[i], metadata[i]);
                        }
                        parsedResults.push(value);
                    });
                    resolve(parsedResults);
                });
            },

            buildLineage: (vials, pooledVials) => {
                return new Promise((resolve, reject) => {
                    vials.forEach(vial => {
                        vial.rootSpecimens = [];
                        if (pooledVials.find(pool => pool.id == vial.bsiId)) {
                            vial.parentIds = pooledVials.find(pool => pool.id == vial.bsiId).parentIds;
                        }
                        if (vial.parentIds.length == 0) {
                            vial.rootSpecimens.push(vial.currentLabel);
                        }
                        else {
                            vial.parentIds.forEach(parent => {
                                vials.find(root => root.bsiId == parent).rootSpecimens.forEach(root =>
                                    vial.rootSpecimens.push(root));
                            });
                        }
                    });
                    resolve(vials);
                });
            }
        },

        pooledTasks: {
            parse: (results) => {
                return new Promise((resolve, reject) => {
                    var pooledVials = [];
                    results.rows.forEach(result => {
                        if (pooledVials.find(vial => vial.id == result[0])) {
                            pooledVials.find(vial => vial.id == result[0]).parentIds.push(result[1]);
                        }
                        else {
                            pooledVials.push({id: result[0], parentIds: [result[1]]});
                        }
                    });
                    resolve(pooledVials);
                });
            }
        }
    }

    var molecularqcs = {
        create: () => {
            return {
                caseId: '',
                lastModified: null,
                tumorDNA: [],
                germlineDNA: [],
                tumorRNA: [],
                normalDNA: [],
                normalRNA: []
            };
        },

        build: (vials) => {
            var molecularqc = molecularqcs.create();
            vials.filter(vial => vial.designatedAliquot.length > 0).forEach(vial => {
                molecularqc.caseId = vial.subjectId;
                molecularqc.lastModified = molecularqcs.getLastModified(molecularqc, vial);

                if (vial.materialType == 'RNA') {
                    if (vial.sampleType == 'NAT') {
                        molecularqc.normalRNA.push(molecularqcs.buildRna(vial));
                    }
                    else if (vial.sampleType == 'Primary') {
                        molecularqc.tumorRNA.push(molecularqcs.buildRna(vial));
                    }
                }
                else if (vial.materialType = 'DNA') {
                    if (vial.sampleType == 'NAT') {
                        molecularqc.normalDNA.push(molecularqcs.buildDna(vial));
                    }
                    else if (vial.sampleType == 'Primary') {
                        molecularqc.tumorDNA.push(molecularqcs.buildDna(vial));
                    }
                    else if (vial.sampleType == 'Normal') {
                        molecularqc.germlineDNA.push(molecularqcs.buildDna(vial));
                    }
                }
            });
            return molecularqc;
        },

        getLastModified: (molecularqc, vial) => {
            var lastModified = molecularqc.lastModified;
            
            if (lastModified == null || lastModified < vial.lastModified) {
                lastModified = vial.lastModified;
            }
            if (lastModified < vial.subjectLastModified) {
                lastModified = vial.subjectLastModified;
            }
            if (lastModified < vial.sampleLastModified) {
                lastModified = vial.sampleLastModified;
            }
            
            return lastModified;
        },

        buildRna: (vial) => {
            return {
                specimenIDs: vial.rootSpecimens.map(root => ({specimenID: root})),
                analyteID: vial.bsiId,
                dateOfExtraction: vial.dateEntered,
                volume: parseFloat(vial.initialVolume),
                rinValue: vial.rin ? parseFloat(vial.rin) : null,
                nanoDrop: {
                    concentration: parseFloat(vial.concentrationByNanodropNgL),
                    a260OverA280: parseFloat(vial['260280']),
                    a260OverA230: parseFloat(vial['260230'])
                }
            }
        },

        buildDna: (vial) => {
            return {
                specimenIDs: vial.rootSpecimens.map(root => ({specimenID: root})),
                analyteID: vial.bsiId,
                dateOfExtraction: vial.dateEntered,
                volume: parseFloat(vial.initialVolume),
                gelScore: parseFloat(vial.agaroseGelScore),
                qubit: {
                    concentration: parseFloat(vial.concentrationByQubitNgL)
                },
                nanoDrop: {
                    concentration: parseFloat(vial.concentrationByNanodropNgL),
                    a260OverA280: parseFloat(vial['260280']),
                    a260OverA230: parseFloat(vial['260230'])
                },
                Bioanalyzer: {
                    min: vial.bioaMinBp,
                    avg: {
                        lower: vial.bioaAvgLowerBp,
                        upper: vial.bioaAvgUpperBp
                    }
                }
            }
        }
    }

    var iscans = {
        create: () => {
            return {
                caseId: '',
                lastModified: null,
                tumorTissue: {
                    iscanMatch: '',
                    iscanContamination: ''
                },
                normalTissue: {
                    iscanMatch: '',
                    iscanContamination: ''
                }
            };
        },

        build: (vials) => {
            var vial = vials.find(vial => vial.tIscanMatch.length > 0 && vial.tIscanContamination.length > 0);
            if (vial) {
                var iscan = iscans.create();
                iscan.caseId = vial.subjectId,
                iscan.lastModified = vial.subjectLastModified,
                iscan.tumorTissue.iscanMatch = vial.tIscanMatch,
                iscan.tumorTissue.iscanContamination = vial.tIscanContamination,
                iscan.normalTissue.iscanMatch = vial.natIscanMatch,
                iscan.normalTissue.iscanContamination = vial.natIscanContamination
                return iscan;
            }
            else {
                return;
            }
        }
    }

    var receipts = {
        receiptMetadata: null,

        parseValue: (value, metadata) => {
            if (metadata.type == 'Date' && value.length > 0) {
                return value.replace(' ', 'T');
            }
            else {
                return value ? value : '';
            }
        },

        fetchMetadata: () => {
            var promises = []
            config.receipts.Metadata.forEach(metadata => {
                promises.push(filterMetadata(metadata.table, metadata.fields))
            });
            return Promise.all(promises).then(fields => {
                receipts.receiptMetadata = [].concat.apply([], fields);
            });
        },

        getMetadata: async () => {
            if (!receipts.receiptMetadata) {
                await receipts.fetchMetadata();
            }
            return receipts.receiptMetadata;
        },

        parse: async (results) => {
            var metadata = await receipts.getMetadata();
            return new Promise((resolve, reject) => {
                var parsedResults = [];
                for (var i = 0; i < results.headers.length; i++) {
                    if (config.receipts.fieldNameMap[metadata[i].name] != undefined) {
                        results.headers[i] = config.receipts.fieldNameMap[metadata[i].name];
                    } else {
                        results.headers[i] = camelize(results.headers[i]);
                    }
                };
                results.rows.forEach(row => {
                    var value = {};
                    for (var i = 0; i < results.headers.length; i++) {
                        value[results.headers[i]] = receipts.parseValue(row[i], metadata[i]);
                    }
                    parsedResults.push(value);
                });
                resolve(receipts.build(parsedResults));
            });
        },

        create: () => {
            return {
                shipmentId: '',
                shipmentType: '',
                courier: '',
                trackingId: '',
                dateCreated: '',
                lastModified: '',
                dateShipped: '',
                dateReceived: '',
                notes: '',
                sender: '',
                kitIds: '',
                recipient: '',
                contents: []
            };
        },

        build: (data) => {
            var shipment = receipts.create();
            var first = data[0];
            shipment.shipmentId = first.shipmentId;
            shipment.shipmentType = first.shipmentType;
            shipment.courier = first.courier;
            shipment.trackingId = first.trackingId;
            shipment.dateCreated = first.dateCreated;
            shipment.lastModified = first.lastModified;
            shipment.dateShipped = first.dateShipped;
            shipment.dateReceived = first.dateReceived;
            shipment.notes = first.notes;
            shipment.sender = first.center.length > 0 ? first.center : first.collectionCenter;
            shipment.kitIds = first.kitIds;
            shipment.recipient = 'VARI';
            shipment.contents = data.filter(row => row.status.length > 0 && row.status != 'Not Received')
            .map(row => { 
                return { kitId: row.kitId, subjectId: row.subjectId, currentLabel: row.currentLabel, 
                    seqnum: row.seqNum, sampleId: row.sampleId, bsiId: row.bsiId}
            });
            return shipment;
        }
    }
    return {
        receipts: {
            parseReport: async (results) => {
                return receipts.parse(results);
            }
        },

        cases: {
            parseReport: (results) => {
                return new Promise((resolve, reject) => {
                    Promise.all([cases.vials.parse(results[0]), cases.pooledTasks.parse(results[1])])
                    .then(async (reports) => {
                        var vials = reports[0];
                        vials = await cases.vials.buildLineage(vials, reports[1]);
                        var molecularqc = molecularqcs.build(vials);
                        var iscan = iscans.build(vials);
                        resolve({molecularqc: molecularqc, iscan: iscan});
                    });
                });
            }
        }
    };
})();

module.exports = bsiParseModule;