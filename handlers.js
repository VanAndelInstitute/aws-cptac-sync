'use strict';

const shipmentReceipts = require('./shipment-receipts');
const bsiCase = require('./bsi-case');
const molecularqcs = require('./molecularqcs');
const iscans = require('./iscans');
const proteins = require('./proteins');

module.exports.pullrecentchanges = async (event, context) => {
    await shipmentReceipts.pullRecentChanges();
    await bsiCase.pullRecentChanges();
};

// Shipment Receipts

module.exports.pullrecentreceipts = async (event, context) => {
    await shipmentReceipts.pullRecentChanges();
};

module.exports.rebuildreceipt = async (event, context) => {
    await shipmentReceipts.rebuild(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "Shipment Receipt '" + event.pathParameters.id + "' has been successfully rebuilt."
    };
};

module.exports.resyncreceipt = async (event, context) => {
    var receipt = await shipmentReceipts.get(event.pathParameters.id);
    await shipmentReceipts.sync(receipt.Item);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "Shipment Receipt '" + event.pathParameters.id + "' has been successfully resynced."
    };
};

module.exports.syncreceipt = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        await shipmentReceipts.sync(shipmentReceipts.dynamoToJson(record.dynamodb.NewImage));
    });
}

module.exports.getreceipt = async (event, context) => {
    var receipt = await shipmentReceipts.get(event.pathParameters.id);
    if (Object.entries(receipt).length === 0 && receipt.constructor === Object) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            },
            body: "Shipment Receipt '" + event.pathParameters.id + "' was not found."
        };
    }
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: receipt.Item})
    };
};

module.exports.getreceiptsync = async (event, context) => {
    var sync = await shipmentReceipts.getSync(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: sync.Item})
    };
};

// Cases
module.exports.rebuildcase = (event, context) => {
    bsiCase.rebuild(event.pathParameters.id);
};

// Molecular QC

module.exports.pullrecentmolecularqcs = async (event, context) => {
    await molecularqcs.pullRecentChanges();
};

module.exports.syncmolecularqc = (event, context) => {
    event.Records.filter(record => record.eventName == 'INSERT').map(async record => {
        molecularqcs.sync(molecularqcs.dynamoToJson(record.dynamodb.NewImage));
    });
};

module.exports.getmolecularqc = async (event, context) => {
    var molecularqc = await molecularqcs.get(event.pathParameters.id);
    if (Object.entries(molecularqc).length === 0 && molecularqc.constructor === Object) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            },
            body: "Molecular QC for case '" + event.pathParameters.id + "' was not found."
        };
    }
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: molecularqc.Item})
    };
};

module.exports.getmolecularqcsync = async (event, context) => {
    var sync = await molecularqcs.getSync(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: sync.Item})
    };
};

module.exports.rebuildmolecularqc = async (event, context) => {
    await molecularqcs.rebuild(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "Molecular QC for case id '" + event.pathParameters.id + "' has been successfully rebuilt."
    };
};

module.exports.resyncmolecularqc = async (event, context) => {
    var molecularqc = await molecularqcs.get(event.pathParameters.id);
    await molecularqcs.sync(molecularqc.Item);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "Molecular QC for case id '" + event.pathParameters.id + "' has been successfully resynced."
    };
};

//IScan

module.exports.pullrecentiscans = async (event, context) => {
    await iscans.pullRecentChanges();
};

module.exports.synciscan = (event, context) => {
    event.Records.filter(record => record.eventName == 'INSERT').map(async record => {
        iscans.sync(iscans.dynamoToJson(record.dynamodb.NewImage));
    });
};

module.exports.getiscan = async (event, context) => {
    var iscan = await iscans.get(event.pathParameters.id);
    if (Object.entries(iscan).length === 0 && iscan.constructor === Object) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            },
            body: "iScan for case '" + event.pathParameters.id + "' was not found."
        };
    }
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: iscan.Item})
    };
};

module.exports.getiscansync = async (event, context) => {
    var sync = await iscans.getSync(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: sync.Item})
    };
};

module.exports.rebuildiscan = async (event, context) => {
    await iscans.rebuild(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "IScan for case id '" + event.pathParameters.id + "' has been successfully rebuilt."
    };
};

module.exports.resynciscan = async (event, context) => {
    var iscan = await iscans.get(event.pathParameters.id);
    await iscans.sync(iscan.Item);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "IScan for case id '" + event.pathParameters.id + "' has been successfully resynced."
    };
};

// Proteins

module.exports.pullrecentproteins = async (event, context) => {
    await proteins.pullRecentChanges();
};

module.exports.syncprotein = (event, context) => {
    event.Records.filter(record => record.eventName == 'INSERT').map(async record => {
        proteins.sync(proteins.dynamoToJson(record.dynamodb.NewImage));
    });
};

module.exports.getprotein = async (event, context) => {
    var protein = await proteins.get(event.pathParameters.id);
    if (Object.entries(protein).length === 0 && protein.constructor === Object) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            },
            body: "Protein for case '" + event.pathParameters.id + "' was not found."
        };
    }
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: protein.Item})
    };
};

module.exports.getproteinsync = async (event, context) => {
    var sync = await proteins.getSync(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: sync.Item})
    };
};

module.exports.rebuildprotein = async (event, context) => {
    await proteins.rebuild(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "Protein for case id '" + event.pathParameters.id + "' has been successfully rebuilt."
    };
};

module.exports.resyncprotein = async (event, context) => {
    var protein = await proteins.get(event.pathParameters.id);
    await proteins.sync(protein.Item);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "Protein for case id '" + event.pathParameters.id + "' has been successfully resynced."
    };
};