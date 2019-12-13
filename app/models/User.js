const mongoose = require('mongoose');
const time = require('../lib/timeLib')
let Schema = mongoose.Schema;

let UserSchema = new Schema({
    userId: {
        type: String,
        default: '',
        index: true,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    countryCode: {
        type: String,
        default: '91'
    },
    mobileNumber: {
        type: Number,
        default: 0
    },
    email: {
        type: String,
        default: ''
    },
    password: {
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


mongoose.model('User', UserSchema);