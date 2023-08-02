const sharp = require('sharp');
// download image
const axios = require("axios");
const express = require("express")
var activeSessions = {}
var sessionBuffers = {}
async function toJSON(image,x,y) {
    let loadedImage = await sharp(image)
    let loadedImgMetadata = await loadedImage.metadata();
    let a = loadedImage.resize(parseInt(x || loadedImgMetadata.width / 2), parseInt(y || loadedImgMetadata.height / 2))
    let json = await a.raw().toBuffer({ resolveWithObject: true });
    return json
}
function randomSessionId() {
    return Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6)
}
// 設定輸入的檔案路徑
const app = express();
app.use(express.static("./static"))
app.use(express.text())
app.use(require("cookie-parser")())
app.use((req,res,next) => {
    res.header("Access-Control-Allow-Credentials", true);
    next()
})
app.get("/startSession", async (req, res) => {
    console.log("Session Request")
    if (activeSessions[req.cookies.session]) return res.json({ status: "error", message: "You already have a session",session:req.cookies.session })
    let ses = randomSessionId()
    res.cookie("session",ses)
    activeSessions[ses] = req.ip
    res.json({ status: "success", session: ses })
})
app.get("/endSession",async (req,res) => {
    if (!req.cookies.session) return res.json({ status: "error", message: "You don't have a session" })
    activeSessions.splice(activeSessions.indexOf(req.cookies.session),1)
    res.clearCookie("session")
    delete activeSessions[ses];
    delete sessionBuffers[ses];
    res.json({ status: "success" })
})
app.post("/sendImageBuffer",(req,res) => {
    if (!req.cookies.session) return res.json({ status: "error", message: "You don't have a session" })
    if (!activeSessions[req.cookies.session]) return res.json({ status: "error", message: "Session not found in server" })

    sessionBuffers[req.cookies.session] = Buffer.from(req.body.replace("data:image/jpeg;base64",""),"base64")
    res.json({ status: "success" })
})
app.get("/getImageBuffer",async (req,res) => {
    if (!activeSessions[req.query.session]) return res.json({ status: "error", message: "Session not found in server" })
    let parsed = await toJSON(sessionBuffers[req.query.session],128,128)
    res.json(parsed)
})
app.get("/validateSession",(req,res) => {
    if(activeSessions[req.query.session]) {
        res.json({ status: "success" })
    } else {
        res.json({ status: "error", message: "Session not found in server" })
    }
})
app.listen(3000, () => {
    console.log("RoMeet Server Started")
})
