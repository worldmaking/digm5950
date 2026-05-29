
const path = require("path")
const fs = require("fs")
const { spawn } = require("child_process")
const http = require('http')

const express = require("express")
const { WebSocketServer } = require("ws")


//// CONFIG
const OUTPUT_DIR = path.resolve(".")
const PORT = 3000
// prores profiles: 2=standard, 3=hq, 4=4444, 5=4444xq
const PRORES_PROFILE = 3

//// SERVER
const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))
// //CORS
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*")
//     res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
//     res.setHeader("Access-Control-Allow-Headers", [
//         "Content-Type", "X-Capture-Name", "X-Width", "X-Height", "X-Total-Frames", "X-FPS"
//     ].join(", "))
//     if (req.method === "OPTIONS") return res.sendStatus(204);
//     next()
// })

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

wss.on("connection", (ws, req) => {

    let frameCount = 0
    let ffmpeg
    let first = true

    console.log("client connected")

    ws.on("message", (data, isBinary) => {
        // first message is JSON
        if (first) {
            const config = JSON.parse(data.toString())
            console.log(config)

            const { name, width, height, fps, totalFrames } = config
            const outputFile = path.join(OUTPUT_DIR, `${name}.mov`)

            console.log(`capture to ${outputFile}, ${width}x${height} at ${fps} fps for ${totalFrames} frames`)
            first = false

            // spwan ffmpeg
            let args = [
                "-y", // overwrite
                "-f", "rawvideo", // because we are sending raw frames
                "-pixel_format", "rgba", 
                "-video_size", `${width}x${height}`,
                "-framerate", String(fps),
                "-i", "pipe:0",
                "-vf", "vflip",
                "-c:v", "prores_ks",
                "-profile:v", String(PRORES_PROFILE),
                "-vendor", "apl0",
                "-pix_fmt", "yuv422p10le", 
                outputFile
            ]
            console.log(args.join(" "))
            ffmpeg = spawn("ffmpeg", args)
            ffmpeg.stderr.on("data", d=>process.stdout.write(d))
            ffmpeg.on("close", (code)=>{
                console.log("ffmpeg exit code", code, "frames:", frameCount)
                ws.send(JSON.stringify({ 
                    ok: code==0, frameCount
                }))
                ws.close()
            })
            return
        } 

        // all other messages are RGBA frames
        console.log("frame", frameCount)

        const canWrite = ffmpeg.stdin.write(data)
        if (!canWrite) {
            ws.pause()
            ffmpeg.stdin.once("drain", ()=>ws.resume())
        }
               
        frameCount++
    })

    ws.on("close", ()=> {
        if (ffmpeg) {
            ffmpeg.stdin.end()
        }
    })

    ws.on("error", (err) => {
        console.error("ws error", err)
        if (ffmpeg) ffmpeg.kill()
    })
})

server.listen(PORT, ()=>{
     console.log(`Server listening on http://localhost:${PORT}`)
})

/*
//// POST STREAM
// all frames streamed into this single request
app.post("/stream", (req, res) => {
    const name = req.headers["x-capture-name"]
    console.log("/stream", name)
})

app.get("/status", (req, res) => {
    res.json({ ok: true })
})

//// LAUNCH
const sslOptions = {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem"),
    allowHTTP1: true
}
*/
/*
app.listen(PORT, ()=>{
    console.log(`Server listening on http://localhost:${PORT}`)
})*/

