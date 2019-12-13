const svgCaptcha = require('svg-captcha');

/**
 * Returns a captcha with SVG and text.
 */
let getCaptcha = (req, res) => {

    var options = {
        size: 5, // size of random string
        ignoreChars: '0o1i', // filter out some characters like 0o1i
        noise: 2, // number of noise lines
        color: true, // characters will have distinct colors instead of grey, true if background option is set
        background: '#f0f0f0' // background color of the svg image
    }
    var captcha = svgCaptcha.create(options);
  //  req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);

} // END getCaptcha()


exports.getCaptcha = getCaptcha;

