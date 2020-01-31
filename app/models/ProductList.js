const mongoose = require('mongoose');
const time = require('../lib/timeLib')
let Schema = mongoose.Schema;

let ProductListSchema = new Schema({
    listId: {
        type: String,
        default: '',
        index: true,
        unique: true,
        required: true
    },
    listOfItems_partial: {
        type: Array,
        default: []
    },
    listOfItems: {
        type: Array,
        default: []
    },
    category: {
        type: String,
        default: ''
    },
    subcategory: {
        type: String,
        default: ''
    },
    brand: {
        type: String,
        default: '',
    },
    lastModifiedOn: {
        type: Date,
        default: time.now()
    },
    createdOn: {
        type: Date,
        default: time.now()
    }
})


mongoose.model('ProductList', ProductListSchema);