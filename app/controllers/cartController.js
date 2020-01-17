const findQuery = require('../lib/mongooseQueryLib/findQuery');
const shortid = require('shortid');
const time = require('../lib/timeLib');
const Response = require('../lib/generateResponseLib');
const mongoose = require('mongoose');
const CartModel = mongoose.model('Cart');


/**
 * Add Items to Cart or "SavedForLater".
 * @param {string} req.body.userId User ID
 * @param {string} req.body.cartItems Cart Items
 * @param {string} req.body.savedForLaterItems Saved For Later Items
 */
let addToCart = (req, res) => {

    let userId = req.body.userId;
    let Items = req.body.cartItems || req.body.savedForLaterItems;

    if (!userId || !Items) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse); return;
    }

    let upsertData, upsertOptions = { upsert: true, overwriteArray: true };

    // Add to Cart
    if (req.body.cartItems) {
        upsertData = new CartModel({
            userId: userId,
            cartItems: JSON.parse(req.body.cartItems)
        });

        upsertOptions.properties = ['cartItems'];
        
        // if single item is to be added (no overwrite on existing cart items)
        if(req.body.overWrite === 'false') 
        upsertOptions.overwriteArray = false;
    }

    // Add to "Saved For Later"
    else {
        upsertData = new CartModel({
            userId: userId,
            savedForLaterItems: JSON.parse(req.body.savedForLaterItems)
        });

        upsertOptions.properties = ['savedForLaterItems'];
    }

    findQuery.findOne('Cart', { userId: userId }, upsertData, upsertOptions, false)
    .then((doc) => {
        let apiResponse = Response.generate(false, 'Items saved successfully!!', 200, doc)
        res.send(apiResponse)
    })
    .catch((err) => {
        console.log(err)
        res.send(err)
    })
}


module.exports = {
    addToCart: addToCart
}

