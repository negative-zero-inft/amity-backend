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
    .listen(3000);

app.on("request", (r) => {
    console.log("received a request for" + r.path)
})
mongoose.connect(env.MONGODB_URL ?? "");
console.log(`amity is running on ${app.server?.hostname}:${app.server?.port}`);
console.log(auther(1150046657))