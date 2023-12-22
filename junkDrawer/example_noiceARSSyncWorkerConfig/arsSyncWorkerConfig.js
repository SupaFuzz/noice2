/*
    new format is a named set of indexedDB instances
    we can keep big tables (like inventory) in their
    own db instance so we don't have to bonk the whole
    startup process waiting on db upgrades for adding
    indexes to unrelated tables ... n' stuff ...
*/

// 'inventory' has a *lot* of config. just put that kinda thing in it's own file for sanity ya dig?
import { InventorySyncConfig } from './arsSyncWorkerConfig.d/inventory.js';


const Config = {

    // ars api connect parameters
    apiConnect: {

        /* home test lab
        user: 'ahicox',
        password: 'bevis74',
        proxyPath: '/REST'
        */
    },

    // execute syncAllForms() every 2 minutes
    mainLoopInterval: (60 * 2) * 1000,

    // when executing syncForm(), call pruneForm if it's been more than 8 hours since the last pruning
    pruneThreshold: (60 * 60 * 8) * 1000,

    // when doing a slow prune, do not allow serialized query parameters on URL to exceed this byte limit for a single chunk
    queryListByteLimit: 3000,

    // for statusUpdate messages where limitMessageFrequency is set true only send if this many ms since last message
    threadMessageLimit: (10000 * .25), // quarter second interval


    /*
        named list of indexedDB instances to create and tables with sync config
    */
    DBs: {

        // mainDB contains everything but the gigantor inventory table
        mainDB: {
            dbName: 'nscanDB_1',
            dbVersion: 1,
            storeDefinitions: {

                // popsq
                poPreSubmitQueue: {
                    createOptions:      { keyPath: 'entryId'},
                    indexes: {
                        entryId:            { keyPath: 'entryId', unique: true, _id: 1 },
                        poNumber:          { keyPath: 'poNumber', _id: 260100023 },
                        poLineNumber:      { keyPath: 'poLineNumber', _id: 536870929 },
                        proVMRecordID:     { keyPath: 'proVMRecordID', _id: 536870921},
                        tagNumber:         { keyPath: 'tagNumber', _id: 260100004 },
                        rfidTagNumber:     { keyPath: 'rfidTagNumber', _id: 536871036 },
                        serialNumber:      { keyPath: 'serialNumber', _id: 200000001 },
                        wpNumber:          { keyPath: 'wpNumber', _id: 1234560129 },
                        trackingNumber:    { keyPath: 'trackingNumber', _id: 1234560126 },
                        __customSubmit:    { keyPath: '__customSubmit', _id: 1234560133 },
                        poAndLineNumber:   { keyPath: ['poNumber', 'poLineNumber'] },
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 1,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:NSCAN2:PO PreSubmitQueue',
                            fields: [
                                'Record Type', 'Quantity', 'Status',
                                'Modified Date', 'Create Date', 'Center',
                                'Building', 'Room', 'Bin/Rack',
                                'Assigned User Login ID', 'NPAM:PRR Data Entry ID', 'NPAM Status',
                                'Manufacturer Name', 'Part Number', 'Property Type',
                                'Product Categorization Tier 1', 'PRR', 'Work Package', 'Unit Price',
                                'Company', 'Last Inventory Date', 'Description', 'MAC Address',
                                'Requisition ID', 'Change ID', 'FSC', 'Last Modified By', 'Modified Date',
                                'Create Date', 'nscanCreateUserAUID', 'nscanCreateDate', 'nscanModifyUserAUID',
                                'nscanModifiedDate', 'lockMessage', 'NPAM:LineItem Entry ID', 'Tracking Number',
                                'TagNumber', 'rfid.TagNumber', 'SerialNumber', 'NPAM:LineItem Entry ID'
                            ],
                            QBE: `(('Status' = "queued") OR ('Status' = "promoted") OR ('Status' = "locked") OR ('Status' = "discard") OR (('Status' ="complete") AND (('Modified Date' >= ($SERVERTIMESTAMP$ - (86400 * 7))) OR ('PRRLineIsClosed' = "false") OR ('PRRLineIsClosed' = $NULL$))))`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
                    }
                },

                // prrDB
                prrDB: {
                    createOptions:      { keyPath: 'entryId'},
                    indexes: {
                        entryId:            { keyPath: 'entryId', unique: true, _id: 1 },
                        recordStatus:       { keyPath: 'recordStatus', _id: 7 },
                        recordID:           { keyPath: 'recordID', _id: 536870921 },
                        prrNumber:          { keyPath: 'prrNumber', _id: 200000020 },
                        wpNumber:           { keyPath: 'wpNumber', _id: 536870922 },
                        status:             { keyPath: 'status', _id: 536870914 },
                        poNumber:           { keyPath: 'poNumber', _id: 536870916 },
                        poLineNumber:       { keyPath: 'poLineNumber', _id: 536870925 },
                        poAndLineNumber:    { keyPath: ['poNumber', 'poLineNumber'] }
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 2,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:PRR Data',
                            fields: [
                                'Request ID', 'Quantity Ordered', 'Burdened Unit Cost',
                                'Vendor', 'Ship To Location', 'Part Description',
                                'Notes', 'iSite Notes', 'Last Modified By', 'Modified Date', 'Create Date'
                            ],
                            QBE: `'PRR Record Status' < "Complete" AND 'Purchase Order No' != "0" AND 'Purchase Order No' != "O" AND 'Purchase Order Line' != $NULL$ AND (NOT('Quantity Ordered' LIKE "-%"))`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours

                    }
                },

                // user
                user: {
                    createOptions: {keyPath: 'entryId'},
                    indexes: {
                        entryId: { keyPath: 'entryId', unique: true, _id: 1 },
                        auid: {keyPath: 'auid', unique: true, _id: 4 },
                        fullName: { keyPath: 'fullName', _id: 1000000017 },
                        center: { keyPath: 'center', _id: 260000001 }
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 3,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'CTM:People',
                            fields: [ 'Full Name', 'Remedy Login ID', 'Site', 'Last Modified Date' ],
                            QBE: `'Remedy Login ID' != $NULL$ AND 'Profile Status' = 1`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        disablePrune: true,
                    }
                },

                // trackingNumberRegistry
                trackingNumberRegistry: {
                    createOptions: { keyPath: 'entryId'},
                    indexes: {
                        entryId:           { keyPath: 'entryId', unique: true, _id: 1 },
                        trackingNumber:    { keyPath: 'trackingNumber', _id: 1234560126 },
                        center:            { keyPath: 'center', _id: 260000001 },
                        poNumber:          { keyPath: 'poNumber', _id: 260100023 },
                        prrNumber:         { keyPath: 'prrNumber', _id: 200000020 },
                        carrier:           { keyPath: 'carrier', _id: 8 }
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 4,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:NSCAN2:TrackingNumberRegistry',
                            fields: [
                                'Manufacturer', 'Received Date', 'Submitter',
                                'Status', 'PO Number', 'Item Count', 'PRR',
                                'Last Modified By', 'Modified Date', 'Create Date'
                            ],
                            QBE: `'Status' != "archive"`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
                    }
                },

                // locationNotes
                locationNotes: {
                    createOptions: { keyPath: 'entryId'},
                    indexes: {
                        entryId:            { keyPath: 'entryId', unique: true, _id: 1 },
                        center:             { keyPath: 'center', _id: 260000001 },
                        building:           { keyPath: 'building', _id: 1000000074 },
                        room:               { keyPath: 'room', _id: 536870914 },
                        centerBuilding:     { keyPath: ['center', 'building'] },
                        centerBuildingRoom: { keyPath: ['center', 'building', 'room'] },
                        changeFlag:         { keyPath: 'changeFlag' }
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 5,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:NSCAN2:LocationNotes',
                            fields: [ 'Bin/Rack', 'Body', 'Create Date', 'Modified Date', 'Assigned To' ],
                            QBE: `'Status' = "show"`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
                    }
                },

                // tagDB
                tagDB: {
                    createOptions: { keyPath: 'entryId'},
                    indexes: {
                        entryId:        { keyPath: 'entryId', unique: true, _id: 1 },
                        rfidTagNumber:  { keyPath: 'rfidTagNumber', unique: true, _id: 8 },
                        type:           { keyPath: 'type', _id: 123456701 },
                        center:         { keyPath: 'center', _id: 260000001 },
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 6,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:NSCAN2:TagRegistry',
                            fields: [ 'Modified Date' ],
                            QBE: `'Status' = "unassigned"`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
                    }
                },

                // poNumberRegistry
                poNumberRegistry: {
                    createOptions: { keyPath: 'entryId'},
                    indexes: {
                        entryId:   { keyPath: 'entryId', unique: true, _id: 1 },
                        poNumber:  { keyPath: 'poNumber', unique: true, _id: 260100023 }
                    },
                    _sync: {
                        enableSync: true,
                        syncOrder: 7,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:NSCAN2:PO Number Registry',
                            fields: [ 'Modified Date' ],
                            QBE: `'Status' = "show" OR 'Status' = "reopen"`
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
                    }
                },

                // stagingDB
                stagingDB: {
                    createOptions: { keyPath: 'entryId'},
                    indexes: {
                        entryId:            { keyPath: 'entryId', unique: true, _id: 1 },
                        serialNumber:       { keyPath: 'serialNumber', _id: 200000001},
                        tagNumber:          { keyPath: 'tagNumber', _id: 260100004},
                        rfidTagNumber:      { keyPath: 'rfidTagNumber', _id: 536871036},
                        Center:             { keyPath: 'Center', _id: 260000001 },
                        Building:           { keyPath: 'Building', _id: 260000004 },
                        Room:               { keyPath: 'Room', _id: 260000005 },
                        CenterBuildingRoom: { keyPath: ['Center', 'Building', 'Room'] },
                        CenterBuilding:     { keyPath: ['Center', 'Building'] },
                        stagingTag:         { keyPath: 'stagingTag', _id: 536870927 },
                        requisitionID:      { keyPath: 'requisitionID', _id: 263000017 },
                        _clientModifyDate:  { keyPath: '_clientModifyDate'},
                        _stagingStatus:     { keyPath: '_stagingStatus', _id: 7},
                        _retagRequired:     { keyPath: '_retagRequired', _id: 536870925 },
                        _detagRequired:     { keyPath: '_detagRequired', _id: 1234560123 }
                    },
                    _sync: {
                        enableSync: false,
                        syncOrder: 8,
                        bulkPutLimit: 1800,
                        query: {
                            schema: 'NPAM:NSCAN2:Row',
                            fields: [ 'Modified Date' ],
                            QBE: `'staging tag' != $NULL$ `
                        },
                        syncInterval: (60 * 2 * 1000), // 2 minutes
                        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
                    }
                },




                /*
                    not sync'd but we need 'em in the db'
                */

                locations: {
                    createOptions:      { keyPath: 'id', autoIncrement: true},
                    indexes: {
                        company:        { keyPath: 'company' },
                        center:         { keyPath: 'center' },
                        building:       { keyPath: 'building' },
                        room:           { keyPath: 'room' }
                    }
                },

                menus: {
                    createOptions:      {keyPath: 'id', autoIncrement: true},
                    indexes: {
                        fieldid:        {keyPath: 'fieldid'}
                    }
                }

            }
        },

        // the gigantor inventory table lol
        inventoryDB: {
            dbName: 'nscanInventoryDB_1',
            dbVersion: 1,
            storeDefinitions: {
                inventory: InventorySyncConfig
            }
        }
    } // end DBs

}

export { Config };
