import { t, Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import mongoose from "mongoose";
import group from "./paths/group";
import user from "./paths/user";
import auth from "./paths/auth";
import { jwt } from "@elysiajs/jwt";
import { env } from "bun";

const app = new Elysia()
    .use(cors({}))
    .use(
        jwt({
            name: 'jwt',
            secret: env.JWT_SECRET ?? "",
            exp: '7d'
        })
    )
    .get("/", () => "amity connected")
    .use(auth)
    .use(group)
    .use(user)
    .listen(3000);

mongoose.connect(env.MONGODB_URL ?? "");
console.log(`Server is running on ${app.server?.hostname}:${app.server?.port}`);