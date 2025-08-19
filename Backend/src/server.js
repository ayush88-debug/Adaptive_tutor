import 'dotenv/config'

import connectDB from './config/connectDB.js';
import app from './app.js'
const port = process.env.PORT || 3000;

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`Appliaction is serving on port ${port}`);
    })
})
.catch((err) => {
    console.log("Mongodb Connection failed : ", err);
})