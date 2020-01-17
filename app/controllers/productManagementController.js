const findQuery = require('../lib/mongooseQueryLib/findQuery');
const shortid = require('shortid');
const time = require('../lib/timeLib');
const Response = require('../lib/generateResponseLib');
const mongoose = require('mongoose');
const ProductListModel = mongoose.model('ProductList');

/**
 * Returns the list of product items as resolved value, error response if rejected.
 * @param {string} productCategory Product category
 * @param {string} productBrand Product Brand
 * @returns List of product Items if promise is resolved, error response otherwise.
 */
let getProductItems = (productCategory, productBrand) => {

    let responseAsPromise
        = findQuery.findOne(
            'ProductList', { category: productCategory, brand: productBrand }, null, null, null
        );

    return responseAsPromise;
}


/**
 * Returns details of a single item.
 * @param {string} req.query.category category of product item
 * @param {string} req.query.brand brand of product item
 * @param {string} req.query.pid product ID
 * @returns Response object containing item details or error response.
 */
let getSingleItem = (req, res) => {

    let productCategory = req.query.category;
    let productBrand = req.query.brand;
    let productId = req.query.pid;

    if (!productCategory || !productBrand || !productId) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse); return;
    }

    // Extract the index of item from the given 'productId'.
    let extractItemIndex = (productId) => {

        let extractedString = productId.match(/N\d+/)[0];
        if (extractedString) {
            let extractedIndex = Number(extractedString.substring(1));
            return extractedIndex;
        }

    }

    getProductItems(productCategory, productBrand)
        .then((productList) => {
            let index = extractItemIndex(productId);
            res.send(Response.generate(false, 'Item retrieved successfully', 200, productList.listOfItems[index]))
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })

} // END getSingleItem


/**
 * Returns all items of a particular product.
 * @param {string} req.query.category category of product item
 * @param {string} req.query.brand brand of product item
 * @returns Response object containing all items of the particular product or error response.
 */
let getAllItems = (req, res) => {

    let productCategory = req.query.category;
    let productBrand = req.query.brand;

    if (!productCategory || !productBrand) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse); return;
    }

    getProductItems(productCategory, productBrand)
        .then((productList) => {
            console.log('product list category & brand -->>', productList.category, productList.brand)
            res.send(Response.generate(false, 'Items retrieved successfully', 200, productList))
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })

}; // END getAllItems()


let setAllItems = (req, res) => {
    let productCategory = req.body.category;
    let productBrand = req.body.brand;
    let Items = JSON.parse(req.body.items);

    if (!productCategory || !productBrand || !Items) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse);
        return;
    }

    let upsertData = new ProductListModel({
        listId: 'LST' + shortid.generate(),
        listOfItems: Items,
        category: productCategory,
        brand: productBrand,
        lastModifiedOn: time.now()
    })

    let queryResponse = findQuery.findOne('ProductList', { category: productCategory, brand: productBrand }, upsertData, true, false);
    queryResponse.then((resolveVal) => {
        console.log('resolveVal----->>', resolveVal.listId, resolveVal.category)
        res.send(Response.generate(false, 'Items saved successfully', 200, resolveVal))
    })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })
}


let getItemDetails = (productName, productID) => {

}


module.exports = {
    setAllItems: setAllItems,
    getAllItems: getAllItems,
    getSingleItem: getSingleItem
}




