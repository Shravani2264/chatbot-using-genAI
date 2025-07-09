require("dotenv").config();
const { urlencoded } = require("body-parser");
const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const uploads = multer({ dest:"uploads/"});

if(!process.env.GEMINI_API_KEY){
    console.error("Error: env file is missing the API  key");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // ✅

app.use(express(urlencoded({extended: true})));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.post("/get", uploads.single("file"), async (req, res)=>{
    const userInput = req.body.msg;
    const file = req.file;

    try{
        const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
        let prompt=[userInput];
        if(file){
            const fileData = fs.readFileSync(file.path);
            const image = {
                inlineData:{
                    data: fileData.toString("base64"),
                    mimeType: file.mimetype, 
                },
            };
            prompt.push(image)
        };
        const response = await model.generateContent(prompt);
        res.send(response.response.text());
    }catch(error){
        console.error("error generating response:",error);
        res.status(error.status ||500).send("an error occurred")
    }finally{
        if(file){
            fs.unlinkSync(file.path);
        }
    }
});

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log(`server running at http://localhost:${PORT}`);
})