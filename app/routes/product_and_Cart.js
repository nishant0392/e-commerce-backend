const appConfig = require("../config/appConfiguration")
const productManagementController = require('../controllers/productManagementController')
const cartController = require('../controllers/cartController')


// Authorization Middlewares
const authMiddleware = require('../middlewares/authorization')


let setRouter = (app) => {

    let baseUrl = appConfig.apiVersion;   // apiVersion = "/api/v2"

    /* Routes related to product management */

    app.post(baseUrl + '/category/product/all', productManagementController.setItems)

    app.get(baseUrl + '/category/product/all', productManagementController.getItems)

    app.get(baseUrl + '/category/product', productManagementController.getSingleItem)


    /* Routes related to Cart */

    app.post(baseUrl + '/cart/add', authMiddleware.isAuthorized, cartController.addToCart)

    app.get(baseUrl + '/cart/items', authMiddleware.isAuthorized, cartController.getUserCart)

}

module.exports = {
    setRouter: setRouter
}
