import Elysia from "elysia"
import { jwt } from "@elysiajs/jwt"
import { env } from "bun"

export default new Elysia()
.use(
    jwt({
        name: 'jwt',
        secret: env.JWT_SECRET ?? "",
        exp: '7d'
    })
)
.group("/group", (app) =>
    app
    .get("/", ({ jwt, query, set }) => {
        set.status = 200
        return "user"
    })
)