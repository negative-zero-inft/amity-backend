import Elysia from "elysia"
import { jwt } from "@elysiajs/jwt"

export default new Elysia()
    .get("/group", ({ }) => {
        
        return "group"
    })
