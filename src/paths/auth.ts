import {Elysia, t} from "elysia"
import { jwt } from "@elysiajs/jwt"
import { User } from "../schemas/user"
import { auther, findRandom32DigitPrime } from "../functions/auther"
import { AmityId } from "../schemas/amityId"
import { randomID } from "../functions/utils"
import { cors } from "@elysiajs/cors"

const server = Bun.env.SERVER_URL

export default new Elysia()
.use(cors())
.use(
    jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET ?? "asd",
        exp: '7d'
    })
)
.listen(3000)
.group("/auth", (app) =>
    app
    .get("/", ({ jwt, query }) => {
        const generated = auther(1814576689)
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

            return "user created"
        }catch(e){
            console.log(e)
            set.status = 500;
            return e
        }
    }, { 
        body: t.Object({
            name: t.String(),
            tag: t.String(),
            password: t.String(),
            cdn: t.String()
        })
    })
    .post("/login", async ({jwt, body: {tag, password}, set}) => {
        try{
            console.log("login")
            const usr = tag.split("@")
            if (usr[1] != server) {
                set.status = 401;
                return "Incorrect instance";
            }
            const user = await User.findOne({ tag: usr[0] });

            if (!user) {
                set.status = 401;
                return 'Unauthorized';
            }

            const isMatch = await Bun.password.verify(password, user.password ?? "");

            if (!isMatch) {
                set.status = 403;
                return `wrong password`;
            }
            
            console.log("user logged in")
            console.log(user);
            set.status = 200
            return {
                token: await jwt.sign({ id: user.id.id, _id: user._id.toString() }),
                authNumber: user.authNumber
            }
        }catch(e){
            console.log(e)
            set.status = 500;
            return e
        }
    }, { 
        body: t.Object({
            tag: t.String(),
            password: t.String()
        })
    })
)