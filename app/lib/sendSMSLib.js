const http = require('http')


/* Send SMS using textlocal.in */

/**
 * Sends SMS to a single user.
 * @param {string} message Text Message
 * @param {number} receiverNo Mobile number of the receiver
 * 
 */
let sendSMS = (message, receiverNo) => {

    /* SMS Configuration */

    var encodedMessage = encodeURIComponent(message);

    var username = process.env.TXTLCL_EMAIL;   // textlocal user email

    var hash = process.env.TXTLCL_HASH; // textlocal hash key

    var senderID = 'TXTLCL'; // default senderID (6 alpha characters) fixed(by textlocal)

    var data = 'username=' + username + '&hash=' + hash + '&sender=' + senderID + '&numbers='
        + receiverNo + '&message=' + encodedMessage;

    var options = {
        host: 'api.textlocal.in',
        path: '/send?' + data
    };

    http.get(options, (response) => {

        var str = '';
    
        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });
    
        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            console.log(str);
        });

    }).end();
}


module.exports = {
    sendSMS: sendSMS
}


