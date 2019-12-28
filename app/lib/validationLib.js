const util = require('./utilityLib')
const Response = require('./generateResponseLib')

/**
 * Checks if all the specified properties exist and non-empty and returns a response object.
 * @param {{}} dataObj Object to validate
 * @param {string[]} properties Array of properties that should exist in the object.
 * @return {{error:boolean, message:string, status:number, data:any}} Response object
 */ 
let validateParams = (dataObj, properties) => {
    let apiResponse = {};
    if (util.isObjectEmpty(dataObj, properties))
        apiResponse = Response.generate(true, 'One or More Parameters were missing.', 400, null);
    else
        apiResponse = Response.generate(false, 'Validation Successful !!', 200, null);

    return apiResponse;
}

module.exports = {
    validateParams: validateParams
}