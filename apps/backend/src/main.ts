import type { User } from "@schemas"
import { UserModel } from "@schemas"
import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import morgan from "morgan"

const app = express()

app.use(cors())
app.use(morgan("dev"))
app.use(express.json())

const port = process.env.PORT || 3333
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

async function connectDB() {
  await mongoose.connect(DATABASE_URL)
}

console.log(`Connecting to ${DATABASE_URL}`)
connectDB().catch((err) => console.log(err))

app.get("/api", async (_req, res) => {
  return res.send({ message: "Welcome to bitwise!" })
})

app.get("/users", async (req, res) => {
  const users = await UserModel.find()
  return res.json(users)
})

app.post("/user", async (req, res) => {
  const { name, email }: User = req.body

  const user = new UserModel({ name, email })
  await user.save()
  return res.json(user)
})

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
})

server.on("error", console.error)
