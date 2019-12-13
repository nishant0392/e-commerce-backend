const Response = require('./generateResponseLib')
const logger = require('./loggerLib')
const bcrypt = require('bcryptjs');
const saltRounds = 10;

let hashPasswordSync = (plainTextPassword) => {
    let salt = bcrypt.genSaltSync(saltRounds);
    let hash = bcrypt.hashSync(plainTextPassword, salt);
    return hash;
}

let comparePassword = (plainTextPassword, hashPassword, cb) => {
    bcrypt.compare(plainTextPassword, hashPassword, (err, result) => {
        if (err) {
            console.log(err.message)
            cb(err, null)
        } else {
            cb(null, result)
        }
    })
}

let comparePasswordWithResponse = (plainTextPassword, hashPassword) => {

    return new Promise((resolve, reject) => {
        bcrypt.compare(plainTextPassword, hashPassword, (err, isMatched) => {
            if (err) {
                console.log(err.message)
                logger.error(err.message, 'bcryptLib: comparePasswordWithResponse()', 7)
                let apiResponse = Response.generate(true, 'Some error occurred. Please try again or later.', 500, null);
                reject(apiResponse);
            }
            else if (isMatched) {
                logger.info("Password Match successful", 'bcryptLib: comparePasswordWithResponse()', 7)
                let apiResponse = Response.generate(false, 'Password Match Successful', 200, null);
                resolve(apiResponse);
            }
            else {
                logger.error("Password did not match !!", 'bcryptLib: comparePasswordWithResponse()', 7)
                let apiResponse = Response.generate(true, 'Password did not match', 404, null);
                reject(apiResponse);
            }
        })
    })
}  // END comparePasswordWithResponse()

let comparePasswordSync = (plainTextPassword, hashPassword) => {
    return bcrypt.compareSync(plainTextPassword, hashPassword);
}

module.exports = {
    hashPassword: hashPasswordSync,
    comparePassword: comparePassword,
    comparePasswordWithResponse: comparePasswordWithResponse,
    comparePasswordSync: comparePasswordSync
}
