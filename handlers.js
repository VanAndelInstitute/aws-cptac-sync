'use strict';

import shipmentReceipts from './shipment-receipts.js';
import bsiCase from './bsi-case.js';
import molecularqcs from './molecularqcs.js';
import iscans from './iscans.js';
import proteins from './proteins.js';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
const lambdaClient = new LambdaClient();

export const pullrecentchanges = async (event, context) => {
    try {
        await shipmentReceipts.pullRecentChanges();
        await bsiCase.pullRecentChanges();
    } catch(error) {
        console.error('Error pulling changes from BSI:', error);
    }
};

// Shipment Receipts

export const pullrecentreceipts = async (event, context) => {
    await shipmentReceipts.pullRecentChanges();
};

export const rebuildreceipt = async (event, context) => {
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

export const resyncreceipt = async (event, context) => {
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

export const syncreceipt = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        await shipmentReceipts.sync(shipmentReceipts.dynamoToJson(record.dynamodb.NewImage));
    });
};

export const getreceipt = async (event, context) => {
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

export const getreceiptsync = async (event, context) => {
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
export const rebuildcase = (event, context) => {
    bsiCase.rebuild(event.pathParameters.id);
};

// Molecular QC

export const pullrecentmolecularqcs = async (event, context) => {
    await molecularqcs.pullRecentChanges();
};

export const syncmolecularqc = (event, context) => {
    event.Records.filter(record => record.eventName == 'INSERT').map(async record => {
        molecularqcs.sync(molecularqcs.dynamoToJson(record.dynamodb.NewImage));
    });
};

export const getmolecularqc = async (event, context) => {
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

export const getmolecularqcsync = async (event, context) => {
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

export const rebuildmolecularqc = async (event, context) => {
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

export const resyncmolecularqc = async (event, context) => {
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

export const pullrecentiscans = async (event, context) => {
    await iscans.pullRecentChanges();
};

export const synciscan = (event, context) => {
    event.Records.filter(record => record.eventName == 'INSERT').map(async record => {
        iscans.sync(iscans.dynamoToJson(record.dynamodb.NewImage));
    });
};

export const getiscan = async (event, context) => {
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

export const getiscansync = async (event, context) => {
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

export const rebuildiscan = async (event, context) => {
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

export const resynciscan = async (event, context) => {
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

export const pullrecentproteins = async (event, context) => {
    await proteins.pullRecentChanges();
};

export const syncprotein = (event, context) => {
    event.Records.filter(record => record.eventName == 'INSERT').map(async record => {
        proteins.sync(proteins.dynamoToJson(record.dynamodb.NewImage));
    });
};

export const getprotein = async (event, context) => {
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

export const getproteinsync = async (event, context) => {
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

export const rebuildprotein = async (event, context) => {
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

export const resyncprotein = async (event, context) => {
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

export const pullrecententityasync = async (event, context) => {
    const command = new InvokeCommand({
        FunctionName: context.functionName.replace("entity-async", event.pathParameters.entity),
        InvocationType: "Event",
    });
    await lambdaClient.send(command);
};