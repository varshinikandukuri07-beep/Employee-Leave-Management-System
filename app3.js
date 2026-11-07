
const express=require("express");
const app=express();
app.get("/",(req,res)=>{
    console.log("Hello World");
    res.send("Hello Students! Check the terminal console");
});
app.listen(3003,()=>{
    console.log("Server Running");
});