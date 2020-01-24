const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OTPVerificationSchema = new Schema({
  mobileNumber: {
    type: Number
  },
  OTP: {
    type: Number
  },
  OTP_GenerationTime: {
    type: Number,
    default: new Date().getTime()
  },
  OTP_ExpirationTime: {
    type: Number,
    default: new Date().getTime() + 10*60*1000  
  },
  attemptsRemaining: {
    type: Number,
    default: 4
  },
  isVerified: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('OTP', OTPVerificationSchema)