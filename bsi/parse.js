'use strict';

const config = require('./config');
const bsiRequest = require('./request');

const bsiParseModule = (function() {
    var shipmentMetadata;
    
    function camelize(str) {
        return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    }
    
    function parseValue(value, metadata) {
        if (metadata.type == 'Date' && value.length > 0) {
            return value.replace(' ', 'T');
        }
        else {
            return value ? value : '';
        }
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

    function fetchShipmentMetadata() {
        var promises = []
        config.shipmentMetadata.forEach(metadata => {
            promises.push(filterMetadata(metadata.table, metadata.fields))
        });
        return Promise.all(promises).then(fields => {
            shipmentMetadata = [].concat.apply([], fields);
        });
    }

    async function getShipmentMetadata() {
        if (!shipmentMetadata) {
            await fetchShipmentMetadata();
        }
        return shipmentMetadata;
    }

    function createNewShipmentReceipt() {
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
    }

    function buildShipmentReceipt(data) {
        var shipment = createNewShipmentReceipt();
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

    return {
        parseShipmentReport: async function(results) {
            var metadata = await getShipmentMetadata();
            return new Promise((resolve, reject) => {
                var parsedResults = [];
                for (var i = 0; i < results.headers.length; i++) {
                    if (config.fieldNameMap[metadata[i].name] != undefined) {
                        results.headers[i] = config.fieldNameMap[metadata[i].name];
                    } else {
                        results.headers[i] = camelize(results.headers[i]);
                    }
                };
                results.rows.forEach(row => {
                    var value = {};
                    for (var i = 0; i < results.headers.length; i++) {
                        value[results.headers[i]] = parseValue(row[i], metadata[i]);
                    }
                    parsedResults.push(value);
                });
                resolve(buildShipmentReceipt(parsedResults));
            });
        }
    };
})();

module.exports = bsiParseModule;