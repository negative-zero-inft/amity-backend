import {Elysia, t} from "elysia"
import { jwt } from "@elysiajs/jwt"
import { env } from "bun"
import { User } from "../schemas/user"
export default new Elysia()
.use(
    jwt({
        name: 'jwt',
        secret: env.JWT_SECRET ?? "",
        exp: '7d'
    })
)
.group("/user", (app) =>
    app
    .get("/", ({ jwt, query, set }) => {
        set.status = 200
        return "user"
    })
    .get("/me", async ({ jwt, query: { token }, set }) => {
        const userToken = await jwt.verify(token)
        if(!userToken) {
            set.status = 401
            return "unauthorized"
        }
        const user = await User.findById(userToken._id)
        if(!user) {
            set.status = 404
            return "user not found"
        }
        set.status = 200
        return user
    })
)