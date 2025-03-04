const server = Bun.env.SERVER_URL ?? "";
import { t, Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import mongoose from "mongoose";

const app = new Elysia()
    .use(cors({}))
    .get("/", () => "amity connected")
    .listen(Bun.env.PORT ?? 3000);

    
mongoose.connect(Bun.env.MONGODB_URL ?? "");
console.log(`Server is running on ${server}`);