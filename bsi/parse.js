'use strict';

import config from './config.js';
import bsiRequest from './request.js';

const bsiParseModule = (() => {
    function camelize(str) {
        return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    }

    async function filterMetadata(table, fieldsToFilter) {
        var fields = await bsiRequest.getTableMetadata(table)
        var sortedMetadata = [];
        fieldsToFilter.forEach(filterField => {
            sortedMetadata.push(fields.find(field => filterField == field.name));
        });
        return sortedMetadata;
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
    
            fetchMetadata: async () => {
                cases.vials.vialMetadata = await Promise.all(
                    config.vials.Metadata.map(metadata =>
                        filterMetadata(metadata.table, metadata.fields)
                ));
            },
    
            getMetadata: async () => {
                if (!cases.vials.vialMetadata) {
                    await cases.vials.fetchMetadata();
                }
                return cases.vials.vialMetadata;
            },

            parse: async (results) => {
                var metadata = await cases.vials.getMetadata();
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
                return parsedResults;
            },

            buildLineage: (vials, pooledVials) => {
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
                return vials;
            }
        },

        pooledTasks: {
            parse: (results) => {
                var pooledVials = [];
                results.rows.forEach(result => {
                    if (pooledVials.find(vial => vial.id == result[0])) {
                        pooledVials.find(vial => vial.id == result[0]).parentIds.push(result[1]);
                    }
                    else {
                        pooledVials.push({id: result[0], parentIds: [result[1]]});
                    }
                });
                return pooledVials;
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
                else if (vial.materialType == 'DNA') {
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
                specimenIDs: vial.rootSpecimens.filter((value, index, self) => self.indexOf(value) === index).map(root => ({specimenID: root})),
                analyteID: vial.bsiId,
                dateOfExtraction: vial.dateEntered,
                volume: vial.initialVolume ? parseFloat(vial.initialVolume) : null,
                rinValue: vial.rin ? parseFloat(vial.rin) : null,
                nanoDrop: {
                    concentration: vial.concentrationByNanodropNgL ? parseFloat(vial.concentrationByNanodropNgL) : null,
                    a260OverA280: vial['260280'] ? parseFloat(vial['260280']) : null,
                    a260OverA230: vial['260230'] ? parseFloat(vial['260230']) : null
                }
            }
        },

        buildDna: (vial) => {
            return {
                specimenIDs: vial.rootSpecimens.filter((value, index, self) => self.indexOf(value) === index).map(root => ({specimenID: root})),
                analyteID: vial.bsiId,
                dateOfExtraction: vial.dateEntered,
                volume: vial.initialVolume ? parseFloat(vial.initialVolume) : null,
                gelScore: vial.agaroseGelScore ? parseFloat(vial.agaroseGelScore) : null,
                qubit: {
                    concentration: vial.concentrationByQubitNgL ? parseFloat(vial.concentrationByQubitNgL) : null
                },
                nanoDrop: {
                    concentration: vial.concentrationByNanodropNgL ? parseFloat(vial.concentrationByNanodropNgL) : null,
                    a260OverA280: vial['260280'] ? parseFloat(vial['260280']) : null,
                    a260OverA230: vial['260230'] ? parseFloat(vial['260230']) : null
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

    var proteins = {
        create: () => {
            return {
                caseId: '',
                lastModified: null,
                tumorProtein: [],
                normalProtein: []
            };
        },

        build: (vials) => {
            var hasProteins = vials.find(vial => vial.designatedAliquot.length > 0 && vial.materialType != 'DNA'
                && vial.materialType != 'RNA');
            if (hasProteins) {
                var protein = proteins.create();

                vials.filter(vial => vial.designatedAliquot.length > 0).forEach(vial => {
                    protein.caseId = vial.subjectId;
                    protein.lastModified = proteins.getLastModified(protein, vial);
    
                    if (vial.materialType != 'DNA' && vial.materialType != 'RNA') {
                        if (vial.sampleType == 'NAT') {
                            if (vial.materialType == 'Cell Pellet') {
                                protein.normalProtein.push(proteins.buildAmlProtein(vial));
                            }
                            else {
                                protein.normalProtein.push(proteins.buildProtein(vial));
                            }
                        }
                        else if (vial.sampleType == 'Primary') {
                            if (vial.materialType == 'Cell Pellet') {
                                protein.tumorProtein.push(proteins.buildAmlProtein(vial));
                            }
                            else {
                                protein.tumorProtein.push(proteins.buildProtein(vial));
                            }
                        }
                    }
                });
                console.log(protein);
                
                return protein;
            }
            else {
                return;
            }
        },

        getLastModified: (protein, vial) => {
            var lastModified = protein.lastModified;
            
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

        buildProtein: (vial) => {
            return {
                specimenIDs: vial.rootSpecimens.filter((value, index, self) => self.indexOf(value) === index).map(root => ({specimenID: root})),
                aliquotID: "",
                analyteID: vial.currentLabel,
                processingDate: new Date(vial.dateEntered.replace(' ', 'T')).toISOString(),
                materialType: vial.materialType,
                volume: vial.volume ? parseFloat(vial.volume) : null,
                volumeUnit: vial.volumeUnit
            }
        },

        buildAmlProtein: (vial) => {
            return {
                specimenIDs: vial.rootSpecimens.filter((value, index, self) => self.indexOf(value) === index).map(root => ({specimenID: root})),
                aliquotID: "",
                analyteID: vial.currentLabel,
                processingDate: "",
                materialType: vial.materialType,
                volume: vial.cellCount ? parseFloat(vial.cellCount) : null,
                volumeUnit: "x10^6"
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

        fetchMetadata: async () => {
            receipts.receiptMetadata = await Promise.all(
                config.receipts.Metadata.map(metadata =>
                    filterMetadata(metadata.table, metadata.fields)
            ));
        },

        getMetadata: async () => {
            if (!receipts.receiptMetadata) {
                await receipts.fetchMetadata();
            }
            return receipts.receiptMetadata;
        },

        parse: async (results) => {
            var metadata = await receipts.getMetadata();
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
            return receipts.build(parsedResults);
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
            parseReport: async (results) => {
                let reports = await Promise.all([cases.vials.parse(results[0]), cases.pooledTasks.parse(results[1])]);
                var vials = reports[0];
                vials = await cases.vials.buildLineage(vials, reports[1]);
                var molecularqc = molecularqcs.build(vials);
                var iscan = iscans.build(vials);
                var protein = proteins.build(vials);
                return {
                    molecularqc: molecularqc,
                    iscan: iscan,
                    protein: protein
                };
            }
        },

        molecularqcs : {
            parseReport: async (results) => {
                let reports = await Promise.all([cases.vials.parse(results[0]), cases.pooledTasks.parse(results[1])])
                var vials = reports[0];
                vials = await cases.vials.buildLineage(vials, reports[1]);
                var molecularqc = molecularqcs.build(vials);
                return molecularqc;
            }
        },

        iscans: {
            parseReport: async (results) => {
                let reports = await Promise.all([cases.vials.parse(results[0]), cases.pooledTasks.parse(results[1])])
                var vials = reports[0];
                vials = await cases.vials.buildLineage(vials, reports[1]);
                var iscan = iscans.build(vials);
                return iscan;
            }
        },

        proteins: {
            parseReport: async (results) => {
                let reports = await Promise.all([cases.vials.parse(results[0]), cases.pooledTasks.parse(results[1])])
                var vials = reports[0];
                vials = await cases.vials.buildLineage(vials, reports[1]);
                var protein = proteins.build(vials);
                return protein;
            }
        }
    };
})();

export default bsiParseModule;