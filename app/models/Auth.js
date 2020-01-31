const mongoose = require('mongoose')
const time = require('../lib/timeLib')
const Schema = mongoose.Schema

const AuthSchema = new Schema({
  userId: {
    type: String
  },
  authToken: {
    type: String
  },
  tokenSecret: {
    type: String
  },
  tokenGenerationTime: {
    type: Date,
    default: time.now()
  },
  captcha: {
    type: String,
    default: ''
  },
  captcha_expirationTime: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('Auth', AuthSchema)
