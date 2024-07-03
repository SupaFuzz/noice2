/*
    mock field config for wcARSFormView.js
*/




/*
    the actual config that gets exported
*/
const demoForm = {

    'TagNumber': {
        fieldName: 'TagNumber',
        label: 'Tag Number',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'tags and identification',
        displayOrder:       1,
        upper_case:         true,
        trim_whitespace:     true,
        poExport:           true,
        mono:               true,
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: true  },
            clone:  { fieldMenu: false, resetUIOnClone: true },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 10, disableModifyAll: true }
        },
        help: "Tag Number currently applied to this item (may be either RFID or UPC)",
    },
    'rfid.TagNumber': {
        fieldName: 'rfid.TagNumber',
        label: 'RFID Tag Number',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'tags and identification',
        displayOrder:       2,
        poExport:           false,
        mono:               true,
        show_menu_button:   true,
        modes:{
            modify: { display: true, editable: true, nullable:true, undoable: false },
            create: { display: true, editable: true, nullable:true, undoable: false },
            clone:  { default: true, editable: true, inheritValue: false, removable: false, fieldMenu: false, showMenuButton: true, resetUIOnClone: true, nullable: true },
            list:   { display: true, editable: true, nullable: true, width: '16em', order: 11, disableModifyAll: true }
        },
        help: "The RFID tag number"
    },

    'paper.TagNumber': {
        fieldName: 'paper.TagNumber',
        label: 'Paper Tag Number',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'tags and identification',
        displayOrder:       3,
        upper_case: true,
        trim_whitespace:     true,
        poExport:           false,
        mono:               true,
        modes:{
            modify: { display: false, editable: false, nullable: true },
            create: { display: false, editable: true, nullable: true },
            clone:  { fieldMenu: false, resetUIOnClone: true },
            list:   { display: false, editable: true, nullable: true, width: '15em', order: 12, disableModifyAll: true }
        },
        help: "The previous paper UPC tag number from before the RFID tag was assigned"
    },

    'Disposition': {
        fieldName: 'Disposition',
        label: 'Disposition',
        type: 'ENUM',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       5,
        poExport:           false,
        capture_value_on:   'change',
        // has different enum values but same position on view vs popsq -- hence the override here
        values: [ 'Managed', 'Vendor', 'Serialized', 'Co-Owned' ],
        modes:{
            modify: { display:true, editable:true, nullable:false, editIfNull:true },
            create: { display:true, editable:true, nullable:false, defaultValue: 'Managed' },
            clone:  { fieldMenu: false },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 8 }
        },
        help: "Type of property item"
    },

    'Category': {
        fieldName: 'Category',
        label: 'Category',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'tags and identification',
        displayOrder:       5,
        poExport:           false,
        modes:{
            modify: { display:true, editable:true, nullable:false },
            create: { display:true, editable:true, nullable:false },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 14 }
        },
        help: "'Category' property categorization from corresponding NPAM:LineItem record"
    },

    'Manufacturer': {
        fieldName: 'Manufacturer',
        label: 'Manufacturer',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'tags and identification',
        displayOrder:       6,
        poExport:           true,
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 16 }
        },
        help: "Manufacturer of the property item",
    },

    'Part Number': {
        fieldName: 'Part Number',
        label: 'Part Number',
        type: 'CHAR',
        label_position:      'left',
        displaySection:     'tags and identification',
        displayOrder:       7,
        upper_case: true,
        trim_whitespace:     true,
        xss_filter:    true,
        poExport:           true,
        mono:               true,
        modes:{
            modify: { display:true, editable:true, nullable:false },
            create: { display:true, editable:true, nullable:false},
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 17 }
        },
        help: "Part Number",
    },

    'SerialNumber': {
        fieldName: 'SerialNumber',
        label: 'Serial Number',
        type: 'CHAR',
        label:              'Serial Number',
        label_position:     'left',
        displaySection:     'tags and identification',
        displayOrder:       8,
        upper_case: true,
        trim_whitespace:     true,
        xss_filter:    true,
        poExport:           true,
        mono:               true,
        modes:{
            modify: { display: true, editable: true, nullable: false, editIfNull: true, undoable: true },
            create: { display: true, editable: true, nullable: false, undoable: true },
            clone:  { fieldMenu: false, default: true, inheritValue: false, inheritUndoValue: true, removable: false, showMenuButton: false, undoable: true, resetUIOnClone: true, nullable: false },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 18, disableModifyAll: true }
        },
        help: "Serial Number"
    },

    'Campus': {
        fieldName: 'Campus',
        label: 'Campus',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'location and assignment',
        displayOrder:       1,
        poExport:           true,
        //type:               "ENUM",
        //capture_value_on:   'change',
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '5em', order: 19 }
        },
        help: "NASA Campus where the property item is located"
    },

    'Building': {
        fieldName: 'Building',
        label: 'Building',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'location and assignment',
        displayOrder:       2,
        poExport:           true,
        enforceMenuValues:        true,
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '7em', order: 20 }
        },
        help: "Building at selected NASA Campus where the property item is located",
        valueDependentMenu: true,
        valueDependentMenuOrder: 1
    },

    'Room': {
        fieldName: 'Room',
        label: 'Room',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'location and assignment',
        displayOrder:       3,
        poExport:           true,
        enforceMenuValues:  true,
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: true },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '5em', order: 21 }
        },
        help: "Room in Building at selected NASA Campus where the property item is located",
        valueDependentMenu: true,
        valueDependentMenuOrder: 2
    },

    'Bin/Rack': {
        fieldName: 'Bin/Rack',
        label: 'Bin/Rack',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'location and assignment',
        displayOrder:       4,
        poExport:           true,
        trim_whitespace:     true,
        xss_filter:    true,
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: true },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '7em', order: 22 }
        },
        help: "Bin/Rack in Room in Building at selected NASA Campus where the property item is located",
        valueDependentMenu: true,
        valueDependentMenuOrder: 3
    },

    'Assigned User Login ID': {
        fieldName: 'Assigned User Login ID',
        type: 'CHAR',
        label:              'Asigned User',
        label_position:     'left',
        displaySection:     'location and assignment',
        displayOrder:       5,
        poExport:           true,
        enforceMenuValues:  true,
        auidField:          true,
        modes:{
            modify: { display: true, editable: true },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: true, default: true, inheritValue: true, removable: true },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 23 }
        },
        help: "User to which the Property Item is assigned"
    },

    'Company': {
        fieldName: 'Company',
        label: 'Company',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'location and assignment',
        displayOrder:       6,
        poExport:           false,
        type:               'ENUM',
        values: [ 'KongDonkey', 'Tragedeigh', 'TeaParks' ],
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: false, defaultValue: 'Corporate_IT_COMMSSVC'},
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: false, editable: true, nullable: true, width: '13em', order: 24 }
        },
        help: "the operational company assigned to the property item"
    },

    'Last Inventory Date': {
        fieldName: 'Company',
        label: 'Company',
        type: 'CHAR',
        label_position:     'left',
        displaySection:     'item information',
        displayOrder:       1,
        poExport:           false,
        capture_value_on:   'change', // note: for datetime-local this is the way (though this one's not editable anyhow)
        modes:{
            modify: { display: true, editable: false, nullable: true },
            create: { display: false, editable: false, nullable: true },
            clone:  { fieldMenu: false },
            list:   { display: false, editable: true, nullable: true, width: '12em', order: 25 }
        },
        help: "Date/Time that the property item was last inventoried",
    },

    'Description': {
        fieldName: 'Description',
        label: 'Description',
        // type is required because the dif between char and textarea is just super burried in the formdef
        type:               'textarea',
        label_position:     'left',
        displaySection:     'item information',
        displayOrder:       2,
        rows:               3,
        upper_case:         true,
        xss_filter:         true,
        mono:               true,
        poExport:           true,
        capture_value_on:   'change',
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 26 }
        },
        help:               "Description of Item",
    },

    'Retail': {
        // type is required since is a char on the view and legit currency on popsq
        fieldName: 'Retail',
        label: 'Retail',
        type:               'CURRENCY',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       4,
        poExport:           true,
        inputmode:          'decimal',
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '7.5em', order: 7 }
        },
        help: "Price in USD of Item"
    },

    'MAC Address': {
        fieldName: 'MAC Address',
        label: 'MAC Address',
        type:               'CHAR',
        label_position:     'left',
        displaySection:     'item information',
        displayOrder:       4,
        upper_case: true,
        trim_whitespace:     true,
        xss_filter:    true,
        mono:               true,
        poExport:           true,
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: true },
            clone:  { fieldMenu: true, inheritValue: false, resetUIOnClone: true },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 27, disableModifyAll: true }
        },
        help: "MAC Address of the property item"
    },

    'Requisition ID': {
        fieldName: 'Requisition ID',
        label: 'Requisition ID',
        type:               'CHAR',
        label_position:     'left',
        displaySection:     'item information',
        displayOrder:       5,
        upper_case: true,
        trim_whitespace:     true,
        xss_filter:    true,
        mono:               true,
        poExport:           true,
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: true },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 28 }
        },
        help: "The Requsition ID associated to the property item"
    },

    'Charger ID': {
        // has different label on the view
        fieldName: 'Charger ID',
        type:               'CHAR',
        label:              'Charger ID',
        label_position:     'left',
        displaySection:     'item information',
        displayOrder:       6,
        upper_case: true,
        trim_whitespace:     true,
        xss_filter:    true,
        poExport:           true,
        mono:               true,
        modes:{
            modify: { display: true, editable: true, nullable: true },
            create: { display: true, editable: true, nullable: true },
            clone:  { fieldMenu: true, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 29 }
        },
        help: "Charger ID associated to the property item"
    },

    'Service Code': {
        fieldName: 'Service Code',
        label: 'Service Code',
        type:               'CHAR',
        label_position:     'left',
        displaySection:     'item information',
        displayOrder:       8,
        poExport:           false,
        modes:{
            modify: { display: true, editable: false, nullable: false },
            create: { display: true, editable: false, nullable: false },
            clone:  { fieldMenu: false, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '4em', order: 14 }
        },
        help: "Service Code for the property item"
    },

    'Status': {
        fieldName: 'Status',
        label: 'Status',
        type:               'ENUM',
        label_position: 'left',
        displaySection: 'receiving',
        displayOrder: 7,
        poExport: false,
        type: 'ENUM',
        values: [ 'Configuration', 'De-Control', 'Deploy', 'Excess', 'Loan', 'Receive', 'Repair', 'Reserve', 'Re-Tag', 'Return to Vendor', 'Spare', 'Survey', 'Trade-in', 'Transfer' ],
        modes: {
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false, defaultValue: 'Deploy'},
            clone:  { fieldMenu: true },
            list:   { display: true, editable: true, nullable: true, width: '8em', order: 13 }
        },
        help: "logistics org workflow status of property record"
    },

    'Create Date': {
        fieldName: 'Create Date',
        label: 'Create Date',
        type:               'TIME',
        label_position:     'left',
        displaySection:     'etc.',
        displayOrder:       1,
        poExport:           false,
        modes:{
            modify: { display: true, editable: false, nullable: true },
            create: { display: false, editable: false, nullable: true },
            clone:  { fieldMenu: false },
            list:   { display: false, editable: false, nullable: true, width: '13em', order: 30 }
        },
        help: "'Create Date' of property record"
    },

    'Modified Date': {
        fieldName: 'Modified Date',
        label: 'Modified Date',
        type:               'TIME',
        label_position:     'left',
        displaySection:     'etc.',
        displayOrder:       2,
        poExport:           false,
        modes:{
            create: { display: false, editable: false, nullable: true },
            modify: { display: true, editable: false, nullable: true },
            clone:  { fieldMenu: false },
            list:   { display: false, editable: false, nullable: true, width: '13em', order: 31 }
        },
        help: "'Last Modified Date' of property record"
    },

    'Last Modified By': {
        fieldName: 'Last Modified By',
        label: 'Last Modified By',
        type:               'CHAR',
        label_position:     'left',
        displaySection:     'etc.',
        displayOrder:       3,
        poExport:           false,
        modes:{
            modify: { display: true, editable: false, nullable: true },
            create: { display: false, editable: false, nullable: true },
            clone:  { fieldMenu: false },
            list:   { display: false, editable: false, nullable: true, width: '10em', order: 32 }
        },
        help: "AUID of NITSM user who last modified property record"
    },

    'Entry ID': {
        id: 1,
        fieldName: 'Entry ID',
        label: 'Entry ID',
        type:               'CHAR',
        label_position:     'none',
        displayOrder:       18,
        poExport:           false,
        modes:{
            modify: { display: false, editable: false, nullable: true },
            create: { display: false, editable: false, nullable: true },
            clone:  { fieldMenu: false },
            list:   { display: true, editable: false, nullable: true, width: '10em', order: 1 }
        },
        help: "'Entry ID' of corresponding property record"
    },

    'Tracking Number': {
        fieldName: 'Tracking Number',
        label: 'Tracking Number',
        type:               'CHAR',
        label_position:     'left',
        displaySection:     'shipping',
        displayOrder:       1,
        xss_filter:    true,
        show_menu_button:   true,
        mono:               true,
        poExport:           true,
        modes: {
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { default: true, removable: false, fieldMenu: false, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '18em', order: 33 }
        },
        help: "The Tracking Number the Property Item was received from the Carrier under"
    },

    'Type': {
        fieldName: 'Type',
        label: 'Type',
        type:               'ENUM',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       6,
        poExport:           true,
        capture_value_on:   'change',
        values: ['Equipment', 'Asset', 'Capital'],
        modes:{
            modify: { display: true, editable: true, nullable: false, editIfNull: true },
            create: { display: true, editable: true, nullable: false, defaultValue: 'Equipment' },
            clone:  { fieldMenu: false },
            list:   { display: true, editable: true, nullable: false, width: '8em', order: 9 }
        },
        help: "Categorization of Property Item"
    },

    'Quantity': {
        fieldName: 'Quantity',
        label: 'Quantity',
        type:               'INTEGER',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       3,
        step:               1,
        min:                1,
        xss_filter:    true,
        poExport:           true,
        capture_value_on:   'change',
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: false, inheritValue: true },
            list:   { display: true, editable: true, nullable: false, width: '5.5em', order: 6 }
        },
        help: "Quantity. For Assets, a value > 1 is possible"
    },

    'Order Number': {
        fieldName: 'Order Number',
        label: 'Order Number',
        type:               'CHAR',
        label_position: 'left',
        displaySection: 'receiving',
        displayOrder: 1,
        upper_case: true,
        trim_whitespace: true,
        xss_filter: true,
        mono: true,
        poExport: true,
        enforceMenuValues: true,
        modes:{
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: false, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 2 }
        },
        help: "The Purchase Order (PO) associated to the property item",
    },

    'Priority': {
        fieldName: 'Priority',
        label: 'Priority',
        type:               'INTEGER',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       2,
        step:               1,
        min:                1,
        xss_filter:         true,
        inputmode:          'numeric',
        poExport:           true,
        modes: {
            modify: { display: true, editable: true, nullable: false },
            create: { display: true, editable: true, nullable: false },
            clone:  { fieldMenu: false, inheritValue: true },
            list:   { display: true, editable: true, nullable: true, width: '5em', order: 3, name: 'Line #' }
        },
        help: "The Line Number of the Property Item within a given Purchase Order (PO)",
        enforceMenuValues: true,
        valueDependentMenu: true,
        valueDependentMenuOrder: 4
    },

    'Package Number': {
        fieldName: 'Package Number',
        label: 'Package Number',
        type:               'CHAR',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       2.5,
        xss_filter:    true,
        poExport:           true,
        mono:               true,
        modes:{
            modify: { display: true, editable: true, nullable: false, nullableOnBogusPO: true },
            create: { display: true, editable: false, nullable: false, nullableOnBogusPO: true },
            clone:  { fieldMenu: false, inheritValue: true, nullableOnBogusPO: true },
            list:   { display: true, editable: true, nullable: true, width: '13em', order: 4 }
        },
        help: "The Package Number associated to the PO Line Number with the given Purchase Order (PO)",
        enforceMenuValues: true,
        valueDependentMenu: true,
        valueDependentMenuOrder: 5
    },

    'PRR': {
        fieldName: 'PRR',
        label: 'PRR',
        type:               'CHAR',
        label:              'Department',
        label_position:     'left',
        displaySection:     'receiving',
        displayOrder:       2.75,
        xss_filter:    true,
        mono:               true,
        poExport:           true,
        modes: {
            modify: { display: true, editable: true, nullable: false, nullableOnBogusPO: true, nullableOnEmptyMenu: true },
            create: { display: true, editable: false, nullable: false, nullableOnBogusPO: true, nullableOnEmptyMenu: true },
            clone:  { fieldMenu: false, inheritValue: true, nullableOnBogusPO: true, nullableOnEmptyMenu: true },
            list:   { display: true, editable: true, nullable: true, width: '10em', order: 5 }
        },
        help: "The Department associated to the PO Line Number with the given Purchase Order (PO)",
        valueDependentMenu: true,
        valueDependentMenuOrder: 6
    },

}

/*
    demoRow - demo record containing the above
*/
const demoRow = {
    'TagNumber': '00005429381',
    'rfid.TagNumber': `NC0000000000005429381`,
    'paper.TagNumber': 'C9381',
    'Disposition': 'Managed',
    'Category': 'Switch',
    'Manufacturer': 'Cisco',
    'Part Number': '12',
    'SerialNumber': '1734203958345096t8',
    'Campus': 'Huntsville',
    'Building': 'HSV-4727',
    'Room': '420',
    'Bin/Rack': 'Top Shelf',
    'Assigned User Login ID': 'scoob',
    'Company': "KongDonkey",
    'Last Inventory Date': '6/27/2024, 9:25:33 PM',
    'Description': "it's just like ... this whole thing, man",
    'Retail': "$350.55",
    'MAC Address': '2c:cf:67:2e:bc:19',
    'Requisition ID': "REQ-1245",
    'Charger ID': 'WRGLBUS-0000001',
    'Service Code': '0420',
    'Status': 'Configuration',
    'Create Date': '2024-06-28T21:23:15',
    'Modified Date': '2024-06-28T21:23:15',
    'Last Modified By': 'Scooby D. Doo',
    'Entry ID': '000000000000001',
    'Tracking Number': '1z836073209-12',
    'Type': 'Equipment',
    'Quantity': '13',
    'Order Number': 'PO-0000443321',
    'Priority': '3',
    'Package Number': 'WP.D.EE.ZNT',
    'PRR': 'PRR-000443321'
}
export { demoForm, demoRow };
