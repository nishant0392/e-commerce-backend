/**
 * Generates a response object.
 * @param {boolean} error true/false
 * @param {string} message Error Message 
 * @param {number} status HTTP Code for status
 * @param {any} data Data to send with response
 * @return Response object
 */
let generateResponse = (error, message, status, data) => {
    let apiResponse = {
        error: error,
        message: message,
        status: status,
        data: data
    };

    return apiResponse;
}

module.exports = {
    generate: generateResponse
}