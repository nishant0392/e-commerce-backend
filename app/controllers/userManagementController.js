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
const SMSLib = require('../lib/SMSLib')
const findQuery = require('../lib/mongooseQueryLib/findQuery')

//Importing the models here 
const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')
const OTPModel = mongoose.model('OTP')

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

    let queryResponse = await findQuery.findOne('Auth', { userId: userId }, newAuthToken, { upsert: true, properties: ['authToken', 'tokenSecret', 'tokenGenerationTime'] }, false);

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
            mobileNumber: req.body.mobile,
            password: bcryptLib.hashPassword(req.body.password),
            lastModifiedOn: time.now(),
            createdOn: time.now()

        }) // end new User model

        let queryResponse = findQuery.findOne('User', { mobileNumber: req.body.mobile }, newUser, { upsert: true }, true);
        queryResponse.then((userAccount) => {
            if (userAccount.userId !== newUser.userId) {
                let apiResponse = Response.generate(true, 'Signup Failed!! User already exists with this number.', 403, null);
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
    let apiResponse = validation.validateParams(req.body, ['mobile', 'password']);
    if (apiResponse.error) {
        res.send(apiResponse);
        return;
    }

    // validate Password
    if (!util.isPasswordValid(req.body.password)) {
        apiResponse = Response.generate(true, 'Signup Failed!! Invalid Password.', 400, null);
        res.send(apiResponse);
        return;
    }

    // check whether the number is verified or not and if verified, create a User Account.
    isNumberVerified(Number(req.body.mobile))
        .then(
            (isVerified) => {
                if (isVerified)
                    createUserAccount();
                else
                    res.send(Response.generate(true, 'Number not verified yet', 401, null));
            })
        .catch((error) => {
            console.log(error)
            res.send(Response.generate(true, 'Invalid Number or not verified yet!!', 401, null));
        })

} // END signup()


/* Validate Login Input */
let validateLogin = async (loginType, email_OR_mobile, password) => {

    let query = (loginType === 'EMAIL') ? { email: email_OR_mobile } : { mobileNumber: email_OR_mobile };

    // validate email/mobile
    let queryResponse = await findQuery.findOne('User', query, null, null, null);

    // validate Password
    await bcryptLib.comparePasswordWithResponse(password, queryResponse.password);

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
    return Promise.resolve(userDetailsObj);

} // END validateLogin()


/**
 * function for login.
 */
let login = (req, res) => {
    
    // validate the request body parameters
    if (!req.body.password || !(req.body.email || req.body.mobile)) {
        let apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
        res.send(apiResponse);
        return;
    }

    let loginType, email_OR_mobile;

    if (req.body.email) {
        loginType = 'EMAIL';
        email_OR_mobile = req.body.email;
    }
    else {
        loginType = 'MOBILE';
        email_OR_mobile = req.body.mobile;
    }

    // validate Login
    validateLogin(loginType, email_OR_mobile, req.body.password)
        .then((userDetails) => generateToken(userDetails))
        .then((tokenDetails) => saveToken(tokenDetails))
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
            res.send(err);
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
                        url: process.env.NODE_ENV === 'development' ? 'http://localhost:4200' : 'http://nishant-kumar.com'
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
        { upsert: false }, null);

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


/**
 * Sends a 6-digit OTP to any mobile number and save OTP on database for verification. 
 * @param {string} req.body.mobile Mobile number to which OTP is to be sent.
 */
let sendOTP = (req, res) => {

    // Generates a 6-digit OTP and returns it
    let generateOTP = () => {
        let OTP = Math.round((0.1 + Math.random()) * 1000000);

        if (OTP > 999999)
            OTP = Math.floor(OTP / 10);

        return OTP;
    }

    let mobile = req.body.mobile;

    if (!mobile) {
        let apiResponse = Response.generate(true, 'Mobile number parameter is missing!!', 400, null);
        res.send(apiResponse); return;
    }

    // Valid mobile number
    if (typeof mobile === 'string' && mobile.length === 10) {

        let _mobile = Number(mobile);
        let OTP = generateOTP();
        let message = `${OTP} is your ${appConfig.appHost} code and is valid for 5 minutes. Do not share the OTP with anyone.`;

        // send OTP
        SMSLib.sendSMS(message, _mobile)
            .then(() => {

                let currentTime = new Date().getTime();

                let newOTP = new OTPModel({
                    mobileNumber: _mobile,
                    OTP: OTP,
                    OTP_GenerationTime: currentTime,
                    OTP_ExpirationTime: currentTime + 5 * 60 * 1000,  // expiration period is 5 minutes
                    attemptsRemaining: 4
                })

                let upsertOptions = {
                    upsert: true,
                    properties: ['OTP', 'OTP_GenerationTime', 'OTP_ExpirationTime', 'attemptsRemaining']
                }

                // Save OTP 
                let queryResponse = findQuery.findOne('OTP', { mobileNumber: _mobile }, newOTP, upsertOptions, false);
                queryResponse.then(
                    (resolveValue) => {
                        console.log('--OTP Sent and Saved:', resolveValue)
                        let apiResponse = Response.generate(false, 'OTP has been sent to ' + mobile, 200, null);
                        res.send(apiResponse)
                    })
                    .catch((error) => {
                        console.log('--OTP Not Saved:', error)
                    })

            })
            .catch((error) => {
                console.log(error)
                res.send({
                    error: true, status: error.status, message: 'Message could not be sent to ' + mobile,
                    Reason: error.errors
                })
            });

    }

    // Invalid Mobile number
    else {
        let apiResponse = Response.generate(true, 'Invalid mobile number', 403, null);
        res.send(apiResponse)
    }

} // END sendOTP


/**
 * Verify OTP . 
 * @param {string} req.body.mobile Mobile number to verify
 * @param {string} req.body.OTP OTP sent to the respective mobile number
 */
let verifyOTP = (req, res) => {

    let mobile = Number(req.body.mobile), OTP = Number(req.body.OTP);

    if (!mobile || !OTP) {
        let apiResponse = Response.generate(true, 'Mobile/OTP parameter is missing!!', 400, null);
        res.send(apiResponse); return;
    }

    //--------------    Verify OTP    --------------
    let queryResponse = findQuery.findOne('OTP', { mobileNumber: mobile }, null, null, null);
    queryResponse.then(
        (doc) => {

            let apiResponse, db_OTP = doc.OTP, db_OTP_ExpirationTime = doc.OTP_ExpirationTime,
                db_attemptsRemaining = doc.attemptsRemaining;

            if (doc.isVerified) {
                // Number already verified
                apiResponse = Response.generate(true, 'Number already verified!!', 401, null);
                res.send(apiResponse)
            }

            else {
                //-----  Number not verified yet  -----

                //--> Check the validity of OTP

                if (db_attemptsRemaining < 1) {
                    // No attempts remaining
                    apiResponse = Response.generate(true, 'Sorry!! You have reached maximum no. of attempts.', 403, null);
                    res.send(apiResponse); return;
                }

                let currentTime = new Date().getTime();
                if (currentTime > db_OTP_ExpirationTime) {
                    // OTP has expired
                    apiResponse = Response.generate(true, 'OTP has expired!!', 403, null);
                    res.send(apiResponse); return;
                }

                //--> Compare received OTP with OTP saved on database
                let upsertOptions = { upsert: true };
                let upsertData = {
                    attemptsRemaining: (db_attemptsRemaining > 0) ? (db_attemptsRemaining - 1) : 0,
                    isVerified: true
                }

                let is_OTP_Matched = (OTP === db_OTP);

                // If OTP doesn't match, decrement the no. of attempts remaining.
                if (!is_OTP_Matched) upsertOptions.properties = ['attemptsRemaining'];

                // OTP is matched
                else upsertOptions.properties = ['attemptsRemaining'];

                //--> Update the database
                findQuery.findOne('OTP', { mobileNumber: mobile }, upsertData, upsertOptions, null)
                    .then((updatedDoc) => {
                        if (updatedDoc.isVerified) 
                            apiResponse = Response.generate(false, 'Number verified successfully!!', 200, null);
                        
                        else if (!is_OTP_Matched) 
                            apiResponse = Response.generate(true, 'Invalid OTP', 404, { attemptsRemaining: updatedDoc.attemptsRemaining });
                        
                        res.send(apiResponse)
                    })
                    .catch((err) => {
                        console.log(err)
                        apiResponse = Response.generate(true, 'Some internal error', 500, null);
                        res.send(apiResponse)
                    })
            }
        })
        .catch((error) => {
            console.log(error)
            res.send(error)
        })
} // END verifyOTP


/**
 * Checks whether a number is verified or not.
 * @param {Number} mobile Mobile Number to verify
 */
let isNumberVerified = async (mobile) => {

    let doc = await findQuery.findOne('OTP', { mobileNumber: mobile }, null, null, null);
    return doc.isVerified;

} // END isNumberVerified


/**
 * Save User address.
 * @param {{}} req Request with body parameters
 ** req.body.address - { areaAndStreet: string, cityOrDistrictOrTown: string, state: string, locality: string,
 *               pincode: string, addressType: string }
 */
let saveUserAddress = (req, res) => {

    let userId = req.body.userId;
    let address = JSON.parse(req.body.address);
    let reqdParams = ['name', 'mobile', 'areaAndStreet', 'cityOrDistrictOrTown', 'state', 'locality', 'pincode', 'addressType'];

    // Validate the request body parameters
    let apiResponse = validation.validateParams(address, reqdParams);
    if (!userId || apiResponse.error) {
        res.send(apiResponse);
        return;
    }

    let upsertData = new UserModel({
        addressList: [address],
        lastModifiedOn: new Date()
    });

    let upsertOptions = {
        upsert: true,
        properties: ['addressList', 'lastModifiedOn'],
        overwriteArray: false
    };

    findQuery.findOne('User', { userId: userId }, upsertData, upsertOptions, false)
        .then((doc) => {
            let apiResponse = Response.generate(false, 'Address saved successfully!!', 200, doc)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })

}


module.exports = {
    signup: signup,
    login: login,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    sendOTP: sendOTP,
    verifyOTP: verifyOTP,
    isNumberVerified: isNumberVerified,
    saveUserAddress: saveUserAddress
}
