import { t, Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import mongoose from "mongoose";
import group from "./paths/group";
import user from "./paths/user";
import auth from "./paths/auth";
import { jwt } from "@elysiajs/jwt";

const app = new Elysia()
    .use(cors({}))
    .use(
        jwt({
            name: 'jwt',
            secret: Bun.env.JWT_SECRET ?? "",
            exp: '7d'
        })
    )
    .get("/", () => "amity connected")
    .use([group, user, auth])
    .listen(Bun.env.PORT ?? 3000);

mongoose.connect(Bun.env.MONGODB_URL ?? "");
console.log(`Server is running on ${app.server?.hostname}:${app.server?.port}`);