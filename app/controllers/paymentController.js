const crypto = require('crypto');
const path = require('path');
const shortid = require('shortid');
const sha512 = require('js-sha512');

var payumoney = require('payumoney-node');
payumoney.setKeys(process.env.PAYUMONEY_KEY, process.env.PAYUMONEY_SALT, process.env.PAYUMONEY_AUTHHEADER);

// set mode
payumoney.isProdMode(false); 

let makePayment_PayUMoney = (req, res) => {

    var baseurl = (process.env.NODE_ENV == "development") ? 'http://localhost:3000' : 'http://api.nkart.nishant-kumar.com';
    var surl =  baseurl + '/api/v2/response/payumoney';
    var furl = surl;

var paymentData = {
    txnid: "ORD" + shortid.generate(),
    productinfo: req.body.productinfo,
    amount: req.body.amount,
    email: req.body.email,
    phone: req.body.phone,
    lastname: req.body.lastname,
    firstname: req.body.firstname,
    surl: surl,
    furl: furl
};

console.log('paymentData:', paymentData)

payumoney.makePayment(paymentData, function(error, payment_redirection_link) {
  if (error || !payment_redirection_link) {
      console.log('error', error)
      let errorResponse = {
      status: 500,
      error: error || 'Some Error occurred'
      }; 
      res.send(JSON.stringify(errorResponse))
  }
  
  else {
    // Payment redirection link
    let successResponse = {
      status: 200,
      data: payment_redirection_link
      }; 
    res.send(successResponse)
    console.log(successResponse)
  }
});
} // makePayment_PayUMoney()



let PayUMoneyResponseHandler = (req, res) => {
   console.log('handler',req.body)
    var key = req.body.key;
    var salt = req.body.salt;
    var txnid = req.body.txnid;
    var amount = req.body.amount;
    var productinfo = req.body.productinfo;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var mihpayid = req.body.mihpayid;
    var status = req.body.status;
    var response_hash = req.body.hash;

    var keyString = key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '||||||||||';
    var keyArray = keyString.split('|');
    var reverseKeyArray = keyArray.reverse();
    var reverseKeyString = salt + '|' + status + '|' + reverseKeyArray.join('|');

    var cryp = crypto.createHash('sha512');
    cryp.update(reverseKeyString);
    var calculate_hash = cryp.digest('hex');

    var message = 'Payment failed for Hash not verified...';
    if (calculate_hash === response_hash)
        message = 'Transaction Successful and Hash Verified...';

    let response_data = {
        key: key, salt: salt, txnid: txnid, amount: amount, productinfo: productinfo,
        firstname: firstname, lastname: lastname, email: email, mihpayid: mihpayid, status: status,
        response_hash: response_hash, message: message
    };

    if (status === "success")
        fileToRender = 'PayUMoney_success.ejs';
    else
        fileToRender = 'PayUMoney_failure.ejs';

    res.render(path.join(__dirname, '..', 'public', 'views', fileToRender), response_data)

} // END generateResponse


module.exports = {
    makePayment_PayUMoney: makePayment_PayUMoney,
    PayUMoneyResponseHandler: PayUMoneyResponseHandler
}

