import { t, Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import mongoose from "mongoose";
import group from "./routes/group";
import user from "./routes/user";
import auth from "./routes/auth";
import { jwt } from "@elysiajs/jwt";
import { env } from "bun";
import { auther } from "./functions/auther";

const app = new Elysia()
    .use(cors({}))
    .use(
        jwt({
            name: 'jwt',
            secret: env.JWT_SECRET ?? "",
            exp: '7d'
        })
    )
    .get("/heartbeat", () => "amity connected")
    .use(auth)
    .use(group)
    .use(user)
    .listen(3000);

mongoose.connect(env.MONGODB_URL ?? "");
console.log(`amity is running on ${app.server?.hostname}:${app.server?.port}`);
console.log(auther(1150046657))