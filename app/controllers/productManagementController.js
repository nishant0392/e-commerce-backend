const findQuery = require('../lib/mongooseQueryLib/findQuery');
const time = require('../lib/timeLib');
const Response = require('../lib/generateResponseLib');
const mongoose = require('mongoose');
const ProductListModel = mongoose.model('ProductList');

/**
 * Returns the list of product items as resolved value, error response if rejected.
 * @param {string} listId List ID of product item
 * @returns List of product items if promise is resolved, error response otherwise.
 */
let getProductItems = (listId) => {
    return findQuery.findOne('ProductList', { listId: listId }, null, null, null);
}


/**
 * Returns details of a single item.
 * @param {string} req.query.listId List ID of product item
 * @param {string} req.query.pid product ID
 * @returns Response object containing item details or error response.
 */
let getSingleItem = (req, res) => {

    let listId = req.query.listId;
    let productId = req.query.pid;

    if (!listId || !productId) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse); return;
    }

    // Extract the index of item from the given 'productId'.
    let extractItemIndex = (productId) => {

        let extractedData = productId.match(/N\d+/);
        if (extractedData) {
            let extractedString = extractedData[0];
            let extractedIndex = Number(extractedString.substring(1));
            return extractedIndex;
        }

    }

    getProductItems(listId)
        .then((productList) => {
            let index = extractItemIndex(productId);

            if (0 <= index && index < productList.listOfItems.length) {

                let item = productList.listOfItems[index];

                if (item && item.primaryDetailsOfItem && item.primaryDetailsOfItem.pid === productId) {
                    res.send(Response.generate(false, 'Item retrieved successfully', 200, productList.listOfItems[index]))
                    return;
                }

            }

            res.send(Response.generate(true, 'Item not found', 404, null))
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })

} // END getSingleItem


/**
 * Returns all items of a particular product (uniquely identified by listId). 
 * For example, category = 'Mobiles' &  brand = 'Redmi' <---> listId = 'LST****'.
 * @param {string} req.query.listId List ID of product item
 * @returns Response object containing all items of the particular product or error response.
 */
let getItems = (req, res) => {

    if (!req.query.listId) {
        let apiResponse = Response.generate(true, 'listId parameter is missing.', 400, null);
        res.send(apiResponse); return;
    }

    getProductItems(req.query.listId)
        .then((productList) => {
            let dataToSend = {
               category: productList.category,
               subcategory: productList.subcategory,
               items: productList.listOfItems_partial
            }
            res.send(Response.generate(false, 'Items retrieved successfully', 200, dataToSend))
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })

} // END getItems()


/**
 * Save product items on database (Restricted access).
 * @param {*} req.body.adminId Administrator ID
 * @param {*} req.body.password Administrator password
 * @param {*} req.body.listId List ID
 * @param {*} req.body.category Product category
 * @param {*} req.body.brand Product brand
 * @param {*} req.body.items_partial Partial details of Product items to add
 * @param {*} req.body.items Product items to add
 */
let setItems = (req, res) => {

    let admin_id = req.body.adminId;
    let admin_pass = req.body.password;

    // Check if it's administrator
    if (admin_id !== process.env.ADMIN_ID || admin_pass !== process.env.ADMIN_PASS) {
        res.send(Response.generate(true, 'Unauthorized access!!', 403, null));
        return;
    }

    let listId = req.body.listId;
    let productCategory = req.body.category;
    let productSubcategory = req.body.subcategory;
    let productBrand = req.body.brand;
    let Items_partial = JSON.parse(req.body.items_partial);
    let Items = JSON.parse(req.body.items);

    if (!listId || !productCategory || !productSubcategory || !productBrand || !Items_partial || !Items) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse); return;
    }

    let upsertData = new ProductListModel({
        listId: listId,
        listOfItems_partial: Items_partial,
        listOfItems: Items,
        category: productCategory,
        subcategory: productSubcategory,
        brand: productBrand,
        lastModifiedOn: time.now()
    })

    let upsertOptions = {
        upsert: true,
        properties: ['listOfItems_partial', 'listOfItems', 'lastModifiedOn'],
        overwriteArray: (req.body.overwrite === 'false') ? false : true
    }

    let queryResponse = findQuery.findOne('ProductList', { listId: listId }, upsertData, upsertOptions, false);
    queryResponse.then((resolveVal) => {
        console.log('resolveVal----->>', resolveVal.listId, resolveVal.category)
        res.send(Response.generate(false, 'Items saved successfully', 200, resolveVal))
    })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })
}


module.exports = {
    setItems: setItems,
    getItems: getItems,
    getSingleItem: getSingleItem
}

