const mongoose = require('mongoose');
require('dotenv').config();

exports.dbConnection=()=>{
mongoose.connect(process.env.MONGODB_URL)
.then(()=>{
    console.log("✅ Database Connected Successfully");
    
}).catch((err)=>{
    console.log(err);
    
})
}