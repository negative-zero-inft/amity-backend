import { t, Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import mongoose from "mongoose";
import group from "./routes/group";
import user from "./routes/user";
import auth from "./routes/auth";
import { jwt } from "@elysiajs/jwt";
import { env } from "bun";
import { auther } from "./functions/auther";
import swagger from "@elysiajs/swagger";
import { email } from "./email";
import folders from "./routes/folders";
import { discord } from "./oauth/discord";
import { github } from "./oauth/github";
import { google } from "./oauth/google";
import { osu } from "./oauth/osu";

const app = new Elysia()
    // TODO: Improve documentation
    .use(swagger({
        path: "/apidocs",
        documentation: {
            info: {
                title: "Amity API documentation",
                version: "1.0.0"
            }
        }
    }))
    .use(email)
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
    .use(folders)
    .group("/oauth", (app) => app
        .use(discord)
        .use(github)
        .use(google)
        .use(osu)
    )
    .listen({hostname: "0.0.0.0", port: env.PORT ?? 3000});

app.on("request", (r) => {
    console.log("received a request for" + r.path)
})
mongoose.connect(env.MONGODB_URL ?? "");
console.log(`amity is running on ${app.server?.hostname}:${app.server?.port}`);
console.log(auther(1150046657))