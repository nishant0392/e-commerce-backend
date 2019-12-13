const mongoose = require('mongoose')
const shortid = require('shortid')
const appConfig = require('../config/appConfiguration')
const Response = require('../lib/generateResponseLib')
const util = require('../lib/utilityLib')
const validation = require('../lib/validationLib')
const bcryptLib = require('../lib/bcryptLib')
const Mailer = require('../lib/EmailLib')
const logger = require('../lib/loggerLib')
const time = require('../lib/timeLib')
const JWT = require('../lib/tokenLib')
const findQuery = require('../lib/mongooseQueryLib/findQuery')

//Importing the models here 
const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')

// Global variables 
let userId = "";
let userName = {};

/* Generates a JWT with userDetails stored as data inside claims and retuns a Promise with resolve value as 
'token details' and reject value as a response object. */
let generateToken = (userDetails) => {

    console.log("Generate token");
    return JWT.generateTokenWithResponse(userDetails);

} // END generateToken()

/* Save JWT(AuthToken) on database */
let saveToken = async (tokenDetails) => {

    console.log("Save token");

    let newAuthToken = new AuthModel({
        userId: userId,
        authToken: tokenDetails.token,
        tokenSecret: tokenDetails.tokenSecret,
        tokenGenerationTime: time.now()
    })

    let queryResponse = await findQuery.findOne('Auth', { userId: userId }, newAuthToken, true, false);

    return queryResponse;

} // END saveToken()


/**
 * function for sign-up.
*/
let signup = (req, res) => {

    // Create User Account
    let createUserAccount = () => {

        let newUser = new UserModel({

            userId: shortid.generate(),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            role: req.body.role,
            countryCode: req.body.countryCode,
            mobileNumber: req.body.mobile,
            email: req.body.email,
            password: bcryptLib.hashPassword(req.body.password),
            lastModifiedOn: time.now(),
            createdOn: time.now()

        }) // end new User model

        let queryResponse = findQuery.findOne('User', { email: req.body.email }, newUser, true, true);
        queryResponse.then((userAccount) => {
            if (userAccount.userId !== newUser.userId) {
                let apiResponse = Response.generate(true, 'Signup Failed!! User already exists with this Email.', 403, null);
                res.send(apiResponse);
            }
            else {
                let userAccountObj = userAccount.toObject();
                util.deleteProperties(userAccountObj, ['password', '__v', '_id']);
                let apiResponse = Response.generate(false, 'Signup Successful!!', 200, userAccountObj);
                res.send(apiResponse);
            }
        })
            .catch((error) => {
                logger.error('Failed to create User account!! Some internal error occurred.', 'userManagementController: createUserAccount()', 10)
                console.log('Error:', error)
                res.send(error)
            })
    } // END createUserAccount()


    // Validate the request body parameters
    let apiResponse = validation.validateParams(req.body, ['firstName', 'lastName', 'countryCode', 'mobile', 'email', 'password']);
    if (apiResponse.error) {
        res.send(apiResponse);
        return;
    }
    if (!util.isEmailValid(req.body.email)) {
        apiResponse = Response.generate(true, 'Signup Failed!! Invalid Email address.', 400, null);
        res.send(apiResponse);
        return;
    }
    if (!util.isPasswordValid(req.body.password)) {
        apiResponse = Response.generate(true, 'Signup Failed!! Invalid Password.', 400, null);
        res.send(apiResponse);
        return;
    }

    createUserAccount();

} // END signup()


/* Validate Login Input */
let validateLogin = async (email, password) => {

    // validate email
    let queryResponse = await findQuery.findOne('User', { email: email }, null, null, null);
    console.log('query Response:', queryResponse)

    // validate Password
    let compareResponse = await bcryptLib.comparePasswordWithResponse(password, queryResponse.password);
    console.log('compare Response:', compareResponse)

    let userDetailsObj = queryResponse.toObject();
    let properties = ['password', '_id', '__v', 'createdOn', 'lastModifiedOn'];
    userDetailsObj = util.deleteProperties(userDetailsObj, properties);
    console.log('User Details: ', userDetailsObj);

    // Setting the userId and userName globally so that it could be used by other functions and also sent 
    // with the response 
    userId = userDetailsObj.userId;
    userName = {
        firstName: userDetailsObj.firstName,
        lastName: userDetailsObj.lastName
    }

    logger.info("Login validation successful.", "userManagementController: validateLogin()", 10);
    Promise.resolve(userDetailsObj);

} // END validateLogin()


/**
 * function for login.
 */
let login = (req, res) => {

    // validate the request body parameters
    let apiResponse = validation.validateParams(req.body, ['email', 'password']);
    if (apiResponse.error) {
        res.send(apiResponse);
        return;
    }

    // validate Login
    validateLogin(req.body.email, req.body.password)
        .then(generateToken)
        .then(saveToken)
        .then((resolveData) => {
            let dataToBeSent = {
                userId: resolveData.userId,
                userName: userName,
                authToken: resolveData.authToken
            }

            let apiResponse = Response.generate(false, 'Login Successful!!', 200, dataToBeSent);
            res.status(200).send(apiResponse)
        })
        .catch((err) => {
            logger.error('Error Handler caught error', 'userManagementController: login()', 10)
            console.log('Error:', err);
            res.status(err.status).send(err);
        })

} // end login()


/**
 * function for Password Reset Mail.
 */
let forgotPassword = (req, res) => {

    /* **** Validate Email **** */
    if (!req.body.email) {
        let apiResponse = Response.generate(true, 'Email field is missing!!', 400, null);
        res.send(apiResponse); return;
    }

    if (!util.isEmailValid(req.body.email)) {
        let apiResponse = Response.generate(true, 'Invalid Email address!!', 400, null);
        res.send(apiResponse); return;
    }

    UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
        if (err) {
            console.log(err);
            logger.error('Error occurred while querying to database.', 'userManagementController: forgotPassword()', 10);
            let apiResponse = Response.generate(true, 'Some internal error occurred while querying to database.', 500, null);
            res.send(apiResponse);
        }
        else if (util.isEmpty(userDetails)) {
            let apiResponse = Response.generate(true, "No account associated with that Email exists.", 404, null);
            res.send(apiResponse);
        }
        else {
            console.log(userDetails);
            // setting userId and userName globally 
            userId = userDetails.userId;
            userName = {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName
            }
            generateToken(userDetails)
                .then(saveToken)
                .then((tokenDetails) => {
                    let emailOptions = {
                        from: appConfig.appHost,
                        to: req.body.email,
                        subject: "Reset Your Password",
                        text: appConfig.appHost,
                    };
                    let viewData = {
                        userId: userId,
                        userName: userName,
                        authToken: tokenDetails.authToken,
                        url: process.env.NODE_ENV === 'development' ? 'http://localhost:4200' : 'planner.nishant-kumar.com'
                    }
                    // Send Email
                    Mailer.sendEmail('reset-password.ejs', viewData, emailOptions)
                        .then((resolve) => {
                            res.send(resolve)
                        })
                        .catch((error) => {
                            console.log(error)
                            res.send(error)
                        })
                })
                .catch((err) => {
                    console.log("Errorhandler caught error:", err);
                    res.status(err.status).send(err);
                })
        }
    })
} // END forgotPassword()

/**
 * function for Password Reset.
 */
let resetPassword = (req, res) => {

    if (!req.body.password || !req.params.userId || !req.params.authToken) {
        let apiResponse = Response.generate(true, 'One or More Parameters are missing!!', 400, null);
        res.send(apiResponse);
        return;
    }

    if (!util.isPasswordValid(req.body.password)) {
        let apiResponse = Response.generate(true, 'Invalid Password!!', 400, null);
        res.send(apiResponse);
        return;
    }

    let hashPassword = bcryptLib.hashPassword(req.body.password);
    let queryResponse = findQuery.findOne('User', { userId: req.params.userId }, { password: hashPassword, lastModifiedOn: time.now() },
        false, null);

    queryResponse.then((userDetails) => {
        let userDetailsObj = userDetails.toObject();
        util.deleteProperties(userDetailsObj, ['_id', '__v', 'password', 'createdOn']);
        let apiResponse = Response.generate(false, 'Password Reset Successful!!', 200, userDetailsObj);
        res.send(apiResponse);
    })
        .catch((err) => {
            console.log("Errorhandler caught error:", err);
            res.status(err.status).send(err);
        })

} // END resetPassword() 

/**
 * function to logout user.
 * auth params: userId.
 */
let logout = (req, res) => {
    AuthModel.findOneAndRemove({ userId: req.user.userId }, (err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'userManagementController: logout', 10)
            let apiResponse = Response.generate(true, `error occurred: ${err.message}`, 500, null)
            res.send(apiResponse)
        } else if (util.isEmpty(result)) {
            let apiResponse = Response.generate(true, 'Already Logged Out or Invalid UserId', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = Response.generate(false, 'Logged Out Successfully', 200, null)
            res.send(apiResponse)
        }
    })
} // end of the logout function.


module.exports = {
    signup: signup,
    login: login,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword
}