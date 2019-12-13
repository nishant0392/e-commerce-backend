"use strict";
const nodemailer = require("nodemailer")
const path = require('path');
const ejs = require('ejs')
const Response = require('./generateResponseLib')
const logger = require('./loggerLib')

/* ****** =================  NodeMailer  ================= ****** */

/** 
 *  function to send Email
**/
let sendEmail = (fileToRender, viewData, emailOptions) => {

  return new Promise((resolve, reject) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    ejs.renderFile(path.join(__dirname, '..', 'public', 'emails', fileToRender), viewData,
      (err, view) => {
        if (err) {
          logger.error('Error occurred while rendering file', 'EmailLib: sendEmail()', 5)
          console.log('Error while rendering file:', err)
          let errorResponse = Response.generate(true, 'Error occurred while rendering file', 500, null);
          reject(errorResponse);
        }
        else {
      

          let mailOptions = {
            from: `"${emailOptions.from} 👻" <${emailOptions.from}@nishant-kumar.com>`, // sender address
            to: emailOptions.to,    // list of receivers
            subject: emailOptions.subject,   // Subject line
            text: emailOptions.text,        // plain text body
            html: view        // html body
          };
        //  console.log("html data ======================>\n", mailOptions.html);

          // Send mail using the default smtp transport
          transporter.sendMail(mailOptions)
            .then((resolveVal) => {
              logger.info('Email Sent Successfully.', 'EmailLib: sendEmail()', 5);
              let successResponse = Response.generate(false, 'Email Sent Successfully.', 200, resolveVal);
              resolve(successResponse);
              console.log("Resolve value:", resolveVal)
            },
              (rejectVal) => {
                console.log('Reason of rejection:- ', rejectVal);
                logger.error('Email could not be sent.', 'EmailLib: sendEmail()', 5);
                
                if (rejectVal.code === 'EAUTH') {    // Invalid login from the Admin using NodeMailer
                  let errorResponse = Response.generate(true, 'Error occurred while sending email', 'EAUTH', null);
                  reject(errorResponse);
                }
                else if (rejectVal.code === 'EENVELOPE') {   // No recipients defined(Invalid Email Address)
                  let errorResponse = Response.generate(true, 'Invalid Email address', 'EENVELOPE', null);
                  reject(errorResponse);
                }
              }).catch((err) => console.log("Errorhandler caught: ", err))
        }
      })
  })
}

/* ****** =================  NodeMailer  ================= ****** */


module.exports = {
  sendEmail: sendEmail
}