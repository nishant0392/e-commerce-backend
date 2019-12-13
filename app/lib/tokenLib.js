const jwt = require('jsonwebtoken')
const shortid = require('shortid')
const logger = require('./loggerLib')
const Response = require('./generateResponseLib')
const secretKey = 'NeverUnderestimateAManWhoKnowsHowToOverestimateHimself';


let generateToken = (data, cb) => {

    try {
        let claims = {
            jwtid: shortid.generate(),
            iat: Date.now(),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            sub: 'authToken',
            iss: 'nishant',
            data: data
        }
        let tokenDetails = {
            token: jwt.sign(claims, secretKey),
            tokenSecret: secretKey
        }
        cb(null, tokenDetails)
    }
    catch (err) {
        console.log(err)
        cb(err, null)
    }

} // END generateToken() 

/* Generates a JWT and returns a Promise (Resolve value = tokenDetails, Reject Value = apiResponse) */
let generateTokenWithResponse = (dataForClaims) => {

    return new Promise((resolve, reject) => {
        generateToken(dataForClaims, (error, tokenDetails) => {
            if (error) {
                console.log(error)
                logger.error('Failed to Generate Token', 'tokenLib: generateTokenWithResponse()', 7)
                let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null);
                reject(apiResponse)
            }
            else {
                resolve(tokenDetails)
            }
        })
    }) // END Promise

} // END generateTokenWithResponse() 

let verifyClaim = (token, secretKey, cb) => {
    // verify a token symmetric
    jwt.verify(token, secretKey, function (err, decoded) {
        if (err) {
            console.log("Error while verifying token");
            console.log(err);
            cb(err, null)
        }
        else {
            console.log("User verified");
            console.log(decoded);
            cb(null, decoded);
        }
    });
}// end verify claim 

let verifyClaimWithoutSecret = (token, cb) => {
    // verify a token symmetric
    jwt.verify(token, secretKey, function (err, decoded) {
        if (err) {
            console.log("Error while verifying token");
            console.log(err);
            cb(err, null)
        }
        else {
            console.log("User verified");
            // console.log(decoded);
            cb(null, decoded)
        }
    });
}// end verify claim 


module.exports = {
    generateToken: generateToken,
    generateTokenWithResponse: generateTokenWithResponse,
    verifyToken: verifyClaim,
    verifyClaimWithoutSecret: verifyClaimWithoutSecret
}