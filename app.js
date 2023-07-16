process.env = require("./.env.js")(process.env.NODE_ENV || "development");
const app = require('express')();


const main = () => {
    const port = process.env.PORT || 9000;

    require('./src/routes/index.js')(app);  //? Endpoints are included from here.

    app.listen(port, () =>
        console.info(`Bot is running and listening on port: ${port}`)
    );
}

main();