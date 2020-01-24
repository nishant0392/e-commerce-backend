const findQuery = require('../lib/mongooseQueryLib/findQuery');
const Response = require('../lib/generateResponseLib');
const mongoose = require('mongoose');
const CartModel = mongoose.model('Cart');


/**
 * Add Items to Cart or "SavedForLater".
 * @param {string} req.body.userId User ID
 * @param {string} req.body.cartItems Cart Items
 * @param {string} req.body.savedForLaterItems Saved For Later Items
 * @param {string} req.body.overWrite If 'false', no overwrite allowed on arrays. 
 */
let addToCart = (req, res) => {

    let mergeDuplicates = (items) => {

        let oldLength = items.length;

        if (oldLength < 2) return;

        // check if any cart item is duplicate
        let positionObj = {};

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let pid = item.pid;

            if (positionObj[pid] || positionObj[pid] === 0) {
                // identified as a duplicate
                items[positionObj[pid]].quantity += item.quantity;

                items.splice(i, 1);
                i--;
                continue;
            }

            positionObj[pid] = i;
        }

        // check if data has changed (i.e., if merging took place)
        let newLength = items.length;
        if (newLength < oldLength)
            return true;

        return false;
    }


    let userId = req.body.userId;
    let cartItems = req.body.cartItems ? JSON.parse(req.body.cartItems) : null;
    let savedForLaterItems = req.body.savedForLaterItems ? JSON.parse(req.body.savedForLaterItems) : null;

    // Validate Parameters
    if (!userId || !(cartItems || savedForLaterItems)) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse); return;
    }

    //--- prepare data and options
    let upsertData, upsertDataObj = { userId: userId };
    let upsertOptions = { upsert: true, overwriteArray: true, properties: [] };

    if (cartItems) {
        upsertDataObj.cartItems = cartItems;
        upsertOptions.properties.push('cartItems');
    }

    if (savedForLaterItems) {
        upsertDataObj.savedForLaterItems = savedForLaterItems;
        upsertOptions.properties.push('savedForLaterItems');
    }

    // create a new document
    upsertData = new CartModel(upsertDataObj);

    // no overwrite on existing cart items (for eg, when single item is to be added)
    if (req.body.overWrite === 'false')
        upsertOptions.overwriteArray = false;

    //--- update the database
    findQuery.findOne('Cart', { userId: userId }, upsertData, upsertOptions, false)
        .then((doc) => {

            // Merging may be required
            if (!upsertOptions.overwriteArray) {

                // merge duplicates
                let _upsertData = {};
                upsertOptions.overwriteArray = true;
                upsertOptions.properties = [];

                if (cartItems) {
                    // if data has changed (i.e., if merging took place), update the database
                    if (mergeDuplicates(doc.cartItems)) {
                        _upsertData.cartItems = doc.cartItems;
                        upsertOptions.properties.push('cartItems');
                    }
                }

                if (savedForLaterItems) {
                    if (mergeDuplicates(doc.savedForLaterItems)) {
                        _upsertData.savedForLaterItems = doc.savedForLaterItems;
                        upsertOptions.properties.push('savedForLaterItems');
                    }
                }

                if (upsertOptions.properties.length > 0) {

                    findQuery.findOne('Cart', { userId: userId }, _upsertData, upsertOptions, false)
                        .then((updatedDoc) => {
                            console.log('updated doc ------>', updatedDoc)
                            let apiResponse = Response.generate(false, 'Items updated and saved successfully!!', 200, updatedDoc);
                            res.send(apiResponse)
                        })
                }
            }

            // Merging not required
            else {
                let apiResponse = Response.generate(false, 'Items saved successfully!!', 200, doc);
                res.send(apiResponse)
            }
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })

} // END addToCart()


/**
 * Get the Cart and "Saved For Later" items.
 * @param {*} req.query.userId userID of the cart owner.
 */
let getUserCart = (req, res) => {

    let userId = req.query.userId;

    if (!userId) {
        let apiResponse = Response.generate(true, 'UserId field is missing.', 400, null);
        res.send(apiResponse); return;
    }

    findQuery.findOne('Cart', { userId: userId }, null, null, null)
        .then((doc) => {
            let result = {
                userId: doc.userId,
                cartItems: doc.cartItems,
                savedForLaterItems: doc.savedForLaterItems
            };
            let apiResponse = Response.generate(false, 'User Cart retrieved successfully!!', 200, result);
            res.send(apiResponse)
        })
        .catch((error) => {
            console.log(error)
            res.send(error)
        })
}


module.exports = {
    addToCart: addToCart,
    getUserCart: getUserCart
}



