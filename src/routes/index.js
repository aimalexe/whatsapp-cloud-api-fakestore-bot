// use strict;
const express = require('express');

const GET_whatsappCallbackUrl = require('./GET-whatsapp_callback_url');
const POST_whatsappCallbackUrl = require('./POST-whatsapp_callback_url');

module.exports = function (app){
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.use('/whatsapp_callback_url', GET_whatsappCallbackUrl);
    app.use('/whatsapp_callback_url', POST_whatsappCallbackUrl);

    app.use('*', (req, res)=> res.status(404).send("Page Not Found"));
}