const mongoose = require('mongoose')
const Response = require('../../lib/generateResponseLib')
const util = require('../../lib/utilityLib')
const logger = require('../../lib/loggerLib')

/** Finds a document and if found, updates it with upsertData in case 'insertOnlyIfNotFound' option is set to
   false, otherwise simply returns it.
   If not found, inserts 'upsertData' as a new document if 'upsertData' exists and 'upsert' option is set to
   true, otherwise simply returns with a 404 response. 
   @param {string} Model Query Model
   @param {} query Query object
   @param {{}} upsertData Data to upsert
   @param {{ upsert: boolean, properties: {}, overwriteArray: boolean }} upsertOptions Upsert options 
   @param {boolean} insertOnlyIfNotFound if true, new document is created only if no document exists.
*/
let findOne = (Model, query, upsertData, upsertOptions, insertOnlyIfNotFound) => {

    const QueryModel = mongoose.model(Model);
    let apiResponse = {};

    return new Promise((resolve, reject) => {
        QueryModel.findOne(query, (err, document) => {
            if (err) {
                console.log(err)
                logger.error('Error occurred while querying to database.', 'findQuery: findOne()', 10);
                apiResponse = Response.generate(true, 'Some internal error occurred while querying to database.', 500, null);
                reject(apiResponse)
            }
            else if (util.isEmpty(document)) {

                // insert a new document when not found
                if (upsertOptions.upsert && upsertData) {
                    upsertData.save((error, savedDocument) => {
                        if (error) {
                            console.log(error)
                            logger.error(error.message, 'findQuery: findOne()', 10);
                            apiResponse = Response.generate(true, 'Failed To Create Document', 500, null)
                            reject(apiResponse)
                        }
                        else {
                            logger.info('Document Created Successfully', 'findQuery: findOne()', 5);
                            resolve(savedDocument)
                        }
                    }) // Document Created
                }
                else {
                    logger.info("Not Found", 'findQuery: findOne()', 5);
                    apiResponse = Response.generate(true, 'Not Found', 404, null);
                    reject(apiResponse)
                }
            }

            else {

                if (insertOnlyIfNotFound)
                    resolve(document)

                // update the document when found
                else if (upsertData) {

                    if (upsertData instanceof QueryModel) {
                        let upsertDataObj = upsertData.toObject();
                        util.updateDocument(document, upsertDataObj, upsertOptions.properties, upsertOptions.overwriteArray);
                    }

                    else if(upsertData instanceof Object)
                        util.updateDocument(document, upsertData, upsertOptions.properties, upsertOptions.overwriteArray);

                    document.save((error, savedDocument) => {
                        if (error) {
                            console.log(error)
                            logger.error(error.message, 'findQuery: findOne()', 10);
                            apiResponse = Response.generate(true, 'Failed To Update Document', 500, null)
                            reject(apiResponse)
                        }
                        else {
                            logger.info('Document Updated Successfully', 'findQuery: findOne()', 5);
                            resolve(savedDocument)
                        }
                    }) // Document Updated
                }

                else {
                    resolve(document)
                }

            }
        })
    })
} // END findOne()

module.exports = {
    findOne: findOne
}