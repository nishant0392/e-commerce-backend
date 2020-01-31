const svgCaptcha = require('svg-captcha');
const Response = require('../lib/generateResponseLib');
const findQuery = require('../lib/mongooseQueryLib/findQuery');

/**
 * Returns a captcha with SVG and text.
 */
let getCaptcha = (req, res) => {

    if (!req.query.userId) {
        res.send(Response.generate(true, 'Missing Parameter', 400, null))
        return;
    }

    var options = {
        size: 5, // size of random string
        ignoreChars: '0o1i', // filter out some characters like 0o1i
        noise: 1, // number of noise lines
        color: true, // characters will have distinct colors instead of grey, true if background option is set
        background: '#f0f0f0' // background color of the svg image
    }
    var captcha = svgCaptcha.create(options);
    var text = captcha.text;
    var expirationTime = new Date().getTime() + 300000;  // expiry time is 5 minutes

    // save captcha on database
    findQuery.findOne(
        'Auth', { userId: req.query.userId },
        { captcha: text, captcha_expirationTime: expirationTime },
        { upsert: true, properties: ['captcha', 'captcha_expirationTime'] }, false
    )
        .then(() => {
            res.type('svg');
            res.send(Response.generate(false, 'captcha fetched successfully !!', 200, captcha.data))
        })
        .catch((error) => {
            console.log(error)
            res.send(error)
        })

} // END getCaptcha()


/**
 *  Verify captcha.
 */
let verifyCaptcha = (req, res) => {

    let userId = req.query.userId;
    let captcha = req.query.captcha;

    if (!userId || !captcha) {
        res.send(Response.generate(true, 'Missing Parameter(s)', 400, null))
        return;
    }

    findQuery.findOne('Auth', { userId: userId }, null, null, null)
        .then((doc) => {
            // check if session has expired
            let currentTime = new Date().getTime();
            if (currentTime >= doc.captcha_expirationTime) 
                res.send(Response.generate(true, 'Your Session has expired!!', 401, null));

            else if (captcha !== doc.captcha)
                res.send(Response.generate(true, 'Captcha Not Verified', 402, null));

            else
                res.send(Response.generate(false, 'Captcha Verified', 200, null));
        })
        .catch((error) => {
            console.log(error)
            res.send(error)
        })
}


module.exports = {
    getCaptcha: getCaptcha,
    verifyCaptcha: verifyCaptcha
}

