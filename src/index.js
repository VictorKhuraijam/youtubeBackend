

  import 'dotenv/config'
  import connectDB from './db/index.js'

  connectDB()




/*
before dotenv had import module restriction

require('dotenv').config({path: '/.env'})
 import dotenv from 'dotenv'
 dotenv.config({
     path: '/.env'
   })

package.json file: "dev":"nodemon -r dotenv/config --experimental-json-modules src/index.js"
*/

/*
// instead of separating the db connect file and directly writting on the index file using IIFE
import mongoose from 'mongoose'
import { DB_NAME } from './constants'
import express from "express"
const app = express()

;(async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
          console.log("Error: Application is not able to talk with the database", error);
        })

        app.listen(process.env.PORT, () => {
          console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
      console.error("Error :", error)
      throw error
    }
})()
*/
