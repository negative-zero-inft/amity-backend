import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { env } from "bun"
import { User } from "../schemas/user"
import { randomID } from "../functions/utils"
import { AmityId } from "../schemas/amityId"
import { Group } from "../schemas/group"
import { Channel, channelSchema } from "../schemas/channel"
import { auther, checkTotp } from "../functions/auther"
import { Message, messageSchema } from "../schemas/message"
import { MessageCluster } from "../schemas/messageCluster"

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
        const mc = await new Channel({
            id: new AmityId({ id: mcRandomid, server: Bun.env.SERVER_URL }),
            type: "text",
            name: "General",
            icon: "Chat",
            messages: []
        })
        if(!has_channels) await mc.save()
        console.log(mc)

        const group = new Group({
            id: amityId,
            name: name,
            icon: icon,
            description: description || "",
            is_public: is_public,
            has_channels: has_channels,
            members: [user.id],
            owner_id: user.id,
            channels: (
                channels?.map(async (e: {type: string, name: string, icon: string}) => {
                    const chRandomid = randomID();
                    const channelAmityId = new AmityId({ id: chRandomid, server: Bun.env.SERVER_URL })
                    const c = new Channel({
                        id: channelAmityId,
                        type: e.type,
                        name: e.name,
                        icon: e.icon,
                        messages: []
                    })
                    await c.save()
                    return c
                }) || [mc]
            )
        })

        await group.save();
        const owner = await User.findOne({_id: profile._id});
        owner?.chats.push({chat_type: "group", id: amityId});
        await owner?.save();
        console.log(group)
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
    if(group.owner_id?.id == uid || group.members.find(e =>{
        if(e.id != uid) return false
        if(e.server != homeserver) return false
        return e
    })){
        return JSON.stringify(group)
    }else{
        set.status = 401
        return "unauthorized"
    }
})
.get("/:id/messages", async ({ jwt, set, query: { totp, uid, homeserver, messageChunk }, body, params: { id } }) => {
    const group = await Group.findOne({"id.id": id})
    if(!group){
        set.status = 404
        return "group not found"
    }
    await group.populate("channels");
    if(group.has_channels){
        set.status = 400
        return "this group has channels"
    }
    const channel = group.channels[0]
    await channel.populate("messages")
    let msgArr = []
    for (let i = 0; i < 100; i++) {
        const chunk = channel.messages[channel.messages.length - (i + 1 + (messageChunk ? (Number(messageChunk) * 100) : 0))]
        if(!chunk) break
        await chunk.populate("messages")
        msgArr.push(chunk)
        console.log(msgArr)
    }
    if(group.is_public) return JSON.stringify(msgArr)
    if(!totp || !uid || !homeserver){
        console.log(totp, uid, homeserver)
        set.status = 401
        return "can't authenticate user"
    }
    const res: {isError: boolean, msg: string} = await checkTotp(totp as string, homeserver as string, uid as string, set)
    if(res.isError){
        return res.msg
    }
    if(group.owner_id?.id == uid || group.members.find(e =>{
        if(e.id != uid) return false
        if(e.server != homeserver) return false
        return e
    })){
        return JSON.stringify(msgArr)
    }else{
        set.status = 401
        return "unauthorized"
    }
})
.post("/:id/messages", async ({ jwt, set, query: { totp, uid, homeserver }, body, params: { id } }) => {
    try{
        const group = await Group.findOne({"id.id": id})
        if(!group){
            set.status = 404
            return "group not found"
        }
        console.log(group, "group")
        await group.populate("channels");
        if(group.has_channels){
            set.status = 400
            return "this group has channels"
        }
        const channel = group.channels[0] as any
        if(!channel) {
            const mcRandomid = randomID();
            const amityId = new AmityId({ id: mcRandomid, server: Bun.env.SERVER_URL })
            const ch = new Channel({
                id: amityId,
                type: "text",
                name: "General"
            })
            await ch.save()
            group.channels.push(ch as any)
            await group.save()
        }

        const res: {isError: boolean, msg: string} = await checkTotp(totp as string, homeserver as string, uid as string, set)
        if(res.isError){
            return res.msg
        }
        if(group.members.find(e =>{
            if(e.id != uid) return false
            if(e.server != homeserver) return false
            return e
        })){
            const amityId = new AmityId({ id: randomID(), server: Bun.env.SERVER_URL })
            const msg = new Message({
                id: amityId,
                author_id: {
                    id: uid,
                    server: homeserver
                },
                type: body.type || "text",
                content: body.content,
                encrypted: body.encrypted || false,
                date: new Date
            })
            await msg.save()
            var latestCluster: any;
            console.log(channel, "here")
            await channel.populate("messages")
            if(channel?.messages?.length > 0){
                latestCluster = channel?.messages[channel.messages.length - 1]
                await latestCluster.populate("messages")
            }
            console.log(latestCluster, "LC")
            if(!latestCluster || latestCluster.messages.length == 100){
                const newCluster = new MessageCluster({
                    id: new AmityId({ id: randomID(), server: Bun.env.SERVER_URL }),
                    author: {
                        id: uid,
                        server: homeserver
                    },
                    date: new Date,
                    messages: [msg]
                })
                await newCluster.save()
                newCluster.populate("messages")
                console.log(newCluster)
                channel.messages.push(await newCluster)
                console.log(channel.messages)
                await channel.save()
                return
            }else{
                latestCluster.messages.push(msg)
                await latestCluster.save()
                return
            }
        }else{
            set.status = 401
            console.log("aici")
            return "unauthorized"
        }
    }catch(e){
        set.status = 500
        console.log(e)
        return e
    }
}, {
    body: t.Object({
        content: t.String(),
        type: t.Optional(t.String()),
        encrypted: t.Optional(t.Boolean())
    })
})
)