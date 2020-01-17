const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CartSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  cartItems: {
    type: Array,
    default: []
  },
  savedForLaterItems: {
    type: Array,
    default: []
  }
})

module.exports = mongoose.model('Cart', CartSchema)