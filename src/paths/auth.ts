import {Elysia, t} from "elysia"
import { jwt } from "@elysiajs/jwt"
import { User } from "../schemas/user"
import { auther, findRandom32DigitPrime } from "../functions/auther"
import { AmityId } from "../schemas/amityId"
import { randomID } from "../functions/utils"

export default new Elysia()
.group("/auth", (app) =>app
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '7d'
        })
    )
    .get("/", ({ jwt, query }) => {
        const generated = auther(1814576689, new Date())
        return generated
    })
    .post("/register", async ({body, set}) =>{
        try{
            
            const user = await User.create({
                name: body.name,
                tag: body.tag,
                id: new AmityId({ id: randomID(), server: Bun.env.SERVER_URL }),
                password: await Bun.password.hash(body.password),
                authNumber: findRandom32DigitPrime(),
                cdn: body.cdn
            })

            await user.save()
            console.log("user created")
            console.log(user)

            set.status = 200
            return "user created"
        }catch(e){
            console.log(e)
            set.status = 500;
            return e
        }
    }, { body: t.Object({
            name: t.String(),
            tag: t.String(),
            password: t.String(),
            cdn: t.String()
    })})
)