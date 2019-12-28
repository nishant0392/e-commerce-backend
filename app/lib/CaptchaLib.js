const svgCaptcha = require('svg-captcha');

/**
 * Returns a captcha with SVG and text.
 */
let getCaptcha = (req, res) => {

    if (req.query.captcha) {

        // if session has expired
        if (!req.session.captcha)
            res.status(404).send('Your Session has expired!!');

        // Verify Captcha
        else if (req.query.captcha === req.session.captcha)
            res.status(200).send('Captcha Verified');
        else
            res.status(500).send('Captcha Not Verified');

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
    req.session.captcha = captcha.text;
    console.log(req.session)
    res.type('svg');
    // res.status(200).send(JSON.stringify(captcha.data));
    res.status(200).send(captcha.data);

} // END getCaptcha()


exports.getCaptcha = getCaptcha;

