import {Elysia, t} from "elysia"
import { jwt } from "@elysiajs/jwt"
import { env } from "bun"
import { User } from "../schemas/user"
import { ChatFolder } from "../schemas/chatFolder"

export default new Elysia()
.use(
    jwt({
        name: 'jwt',
        secret: env.JWT_SECRET ?? "",
        exp: '7d'
    })
)
.group("/folders", (app) =>
app
.get("/", async ({ jwt, set, query }) => {
    const profile = await jwt.verify(query.token)
    if (!profile) {
        set.status = 401;
        return 'Unauthorized';
    }
    const user = await User.findOne({ _id: profile._id });
    return JSON.stringify(user?.chat_folders);
})
    .post("/new", async ({ jwt, set, query, body: { icon, name, elements } }) => {
        try{
            const profile = await jwt.verify(query.token)
            if (!profile) {
                set.status = 401;
                return 'Unauthorized';
            }
            if(!icon && !name){
                set.status = 400;
                return "You must include either the name or the icon"
            }
            const user = await User.findOne({ _id: profile._id });
            console.log(elements)
            const chatFolder = new ChatFolder({
                icon: icon,
                name: name,
                elements: elements
            })
            user?.chat_folders.push(chatFolder);
            await user?.save();
            return JSON.stringify(chatFolder);
        }catch(e){
            set.status = 500;
            console.log(e);
            return e;
        }
    }, {
        body: t.Object({
            icon: t.Optional(t.String()),
            name: t.Optional(t.String()),
            elements: t.Optional(t.Array(t.Object({
                id: t.Object({
                    id: t.String(),
                    server: t.String()
                }),
                chat_type: t.String()
            })))
        })
    })
    .put("/", async({jwt, set, query, error, body}) => {
        try{
                const profile = await jwt.verify(query.token)
            if (!profile) {
                set.status = 401;
                return 'Unauthorized';
            }
            const user = await User.findOne({_id: profile._id});
            if(!user?.chat_folders) return error(500);
            for(let i = 0; i < user?.chat_folders.length; i++) {
                const folder = user?.chat_folders[i];
                if(folder._id.toString() == body._id) {
                    folder.icon = body.icon;
                    folder.name = body.name;
                    if(body.elements) folder.elements = body.elements;
                }
            }
            await user?.save();
        }catch(e){
            set.status = 500;
            return e;
        }
    }, {
        body: t.Object({
            _id: t.String(),
            icon: t.Optional(t.String()),
            name: t.Optional(t.String()),
            elements: t.Optional(t.Any())
        })
    })
    .delete("/", async({jwt, set, query, body: {_id}}) => {
        const profile = await jwt.verify(query.token)
        if (!profile) {
            set.status = 401;
            return 'Unauthorized';
        }
        const user = await User.findOne({_id: profile._id});
        user?.chat_folders.pull({_id: _id});
        await user?.save();
        return;
    }, {
        body: t.Object({
            _id: t.String()
        })
    })
)