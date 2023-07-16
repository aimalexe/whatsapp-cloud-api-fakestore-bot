const router = require('express').Router();

module.exports = router.get("/", async (req, res) => {
    try {
        console.log("GET: someone is pinging");

        const mode = req.query["hub.mode"]
        const challenge = req.query["hub.challenge"];
        const token = req.query["hub.verify_token"];

        if (
            mode && token &&
            mode == 'subscribe' &&
            token == process.env.Meta_WA_VerifyToken
        )
            return res.status(200).send(challenge);
        else
            return res.sendStatus(403);

    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});