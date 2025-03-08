import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { env } from "bun"
import { User } from "../schemas/user"
import { randomID } from "../functions/utils"
import { AmityId } from "../schemas/amityId"
import { Group } from "../schemas/group"
import { Channel } from "../schemas/channel"
import { auther, checkTotp } from "../functions/auther"

export default new Elysia()
.use(
    jwt({
        name: 'jwt',
        secret: env.JWT_SECRET ?? "",
        exp: '7d'
    })
)
.group("/group", (app) =>
app
.get("/", ({ jwt, query, set }) => {
    set.status = 200
    return "user"
})
.post("/create", async ({ jwt, query, set, body: { name, icon, description, is_public, has_channels, channels } }) =>{

    try{
        const profile = await jwt.verify(query.token)
        if (!profile) {
            set.status = 401;
            return 'Unauthorized';
        }
        const user = await User.findOne({_id: profile._id})
        if(!user) {
            set.status = 401;
            return 'Unauthorized';
        }
        const randomid = randomID();
        const amityId = new AmityId({ id: randomid, server: Bun.env.SERVER_URL })
        const mcRandomid = randomID();
        const mcannelAmityId = new AmityId({ id: mcRandomid, server: Bun.env.SERVER_URL })

        const group = new Group({
            id: amityId,
            name: name,
            icon: icon,
            description: description || "",
            is_public: is_public,
            has_channels: has_channels,
            members: [user.id],
            owner_id: user.id,
            channels: channels?.map((e: {type: string, name: string, icon: string}) => {
                const chRandomid = randomID();
                const channelAmityId = new AmityId({ id: chRandomid, server: Bun.env.SERVER_URL })
                return new Channel({
                    id: channelAmityId,
                    type: e.type,
                    name: e.name,
                    icon: e.icon
                })
            }) || [new Channel({
                id: mcannelAmityId,
                type: "text",
                name: "General"
            })]
        })

        await group.save();
        const owner = await User.findOne({_id: profile._id});
        owner?.chats.push({chat_type: "group", id: amityId});
        await owner?.save();
        return JSON.stringify(group);
    }catch(err){
        console.log(err)
        set.status = 500
        return err
    }
}, {
    body: t.Object({
        name: t.String(),
        icon: t.Optional(t.String()),
        description: t.Optional(t.String()),
        is_public: t.Boolean(),
        has_channels: t.Boolean(),
        channels: t.Optional(t.Array(t.Object({
            type: t.String(),
            name: t.String(),
            icon: t.String()
        })))
    })
})
.get("/:id/info", async ({ jwt, set, query: { totp, uid, homeserver }, body, params: { id } }) => {
    const group = await Group.findOne({"id.id": id})
    if(!group){
        set.status = 404
        return "group not found"
    }
    await group.populate({
        path: "channels",
        select: "-messages"
    });
    if(group.is_public) return JSON.stringify(group)
    if(!totp || !uid || !homeserver){
        console.log(totp, uid, homeserver)
        set.status = 401
        return "can't authenticate user"
    }
    const res: {isError: boolean, msg: string} = await checkTotp(totp, homeserver, uid, set)
    if(res.isError){
        return res.msg
    }
    if(group.owner_id?.id == uid || group.members.find(e => e.id.id == uid && e.id.server == homeserver)){
        return JSON.stringify(group)
    }else{
        set.status = 401
        return "unauthorized"
    }
})
)