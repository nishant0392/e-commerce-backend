const appConfig = require("../config/appConfiguration")
const userManagementController = require('../controllers/userManagementController')
const paymentController = require('../controllers/paymentController')
const Captcha = require('../lib/CaptchaLib')


// Authorization Middlewares
const authMiddleware = require('../middlewares/authorization')


let setRouter = (app) => {
    let baseUrl = appConfig.apiVersion;   // apiVersion = "/api/v2"

    /* Routes related to Payment Management */

    app.post(baseUrl+'/payment/payumoney', authMiddleware.isAuthorized, paymentController.makePayment_PayUMoney);

    app.post(baseUrl+'/response/payumoney', paymentController.PayUMoneyResponseHandler);

    /* Routes related to User Management */

    app.post(baseUrl+'/users/signup', userManagementController.signup);

    app.post(baseUrl+'/users/login', userManagementController.login);

    app.get(baseUrl+'/users/logout', authMiddleware.isAuthorized, userManagementController.logout);

    app.post(baseUrl+'/users/forgot-password', userManagementController.forgotPassword);

    app.post(baseUrl+'/users/reset-password/:userId/:authToken', authMiddleware.isUserAuthorized, userManagementController.resetPassword);

    app.post(baseUrl+'/users/userAddress', authMiddleware.isAuthorized, userManagementController.saveUserAddress);

    app.get(baseUrl+'/users/details', authMiddleware.isAuthorized, userManagementController.getUserDetails);

    /* Routes related to Miscellaneous */
    app.get(baseUrl+'/captcha/get', authMiddleware.isAuthorized, Captcha.getCaptcha);

    app.get(baseUrl+'/captcha/verify', authMiddleware.isAuthorized, Captcha.verifyCaptcha)

    app.post(baseUrl+'/sendOTP', userManagementController.sendOTP)   

    app.post(baseUrl+'/verifyOTP', userManagementController.verifyOTP)    
    
}

module.exports = {
    setRouter: setRouter
}
