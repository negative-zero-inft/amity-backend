import { t, Elysia } from "elysia";
import { jwt } from '@elysiajs/jwt'
import { randomID } from './utils';
import { google } from "./oauth/google"
import { github } from "./oauth/github";
import { discord } from "./oauth/discord";
import { osu } from "./oauth/osu";
import { user } from "./user";
import { User } from "./schemas/user";
import { Group } from "./schemas/group";
import { Channel } from "./schemas/channel";
import { AmityId } from "./schemas/amityId";
import mongoose from "mongoose";
import { Message } from "./schemas/message";
import { dm } from "./dm";
import { cors } from "@elysiajs/cors";

const server = Bun.env.SERVER_URL ?? "";

const app = new Elysia()
    .use(cors({}))
    .use(
        jwt({
            name: 'jwt',
            secret: Bun.env.JWT_SECRET ?? "asd",
            exp: '1d'
        })
    )
    .get("/heartbeat", () => "amity connected")
    .use(user)
    .use(dm)
    .group("/auth", (app) =>
        app
            .use(google)
            .use(github)
            .use(discord)
            .use(osu)
    )
    .post('/register', async ({ set, body: { password, tag, name, cdn } }) => {
        const randomid = randomID();
        // await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${server})`;
        // await sql`INSERT INTO users (id, tag, name, password, avatar) VALUES 
        // (${randomid}, ${tag}, ${name}, ${await Bun.password.hash(password)}, ${avatar})`;

        const amityId = new AmityId({ id: randomid, server: Bun.env.SERVER_URL })

        const user = new User({
            id: amityId,
            tag: tag,
            name: name,
            password: await Bun.password.hash(password),
            cdn: cdn
        });
        await user.save();
    }, {
        body: t.Object({
            tag: t.String(),
            password: t.String(),
            name: t.String(),
            cdn: t.String()
        })
    })
    .post('/signin', async ({ jwt, set, body: { tag, password } }) => {
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
        console.log(user);
        return await jwt.sign({ id: user.id.id, _id: user._id.toString() })
    }, {
        body: t.Object({
            tag: t.String(),
            password: t.String(),
        })
    })
    .get('/profile', async ({ jwt, set, query }) => {

        const profile = await jwt.verify(query.token)

        if (!profile) {
            set.status = 401;
            return 'Unauthorized';
        }

        return profile.id
    })
    .group('/channel', (app) =>
        app
            .post('/create', async ({ jwt, set, body: { token, group_id, type, name, icon_id } }) => {
                const profile = await jwt.verify(token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const randomid = randomID();
                const group = await Group.findOne({ 'id.id': group_id, owner_id: profile._id })
                if (!group) {
                    set.status = 401;
                    return 'Unauthorized';
                }

                const amityId = new AmityId({ id: randomid, server: Bun.env.SERVER_URL })
                const channel = new Channel({
                    id: amityId,
                    type: type,
                    name: name,
                    icon_id: icon_id
                });
                await channel.save();
                group?.channels.push(channel);
                await group?.save();
                return JSON.stringify(channel);
            }, {
                body: t.Object({
                    token: t.String(),
                    type: t.Number(),
                    name: t.String(),
                    group_id: t.String(),
                    icon_id: t.Optional(t.String())
                })
            })
            .get("/:id/messages", async ({ jwt, set, query, params: { id } }) => {
                const profile = await jwt.verify(query.token)
                const limit = Number(query.limit) < 100 ? Number(query.limit) : 100;
                const channel = await Channel.findOne({ "id.id": id });
                const group = await Group.findOne({ 'channels': channel?._id });
                console.log("GROUP: ", group);
                if (!group?.is_public) {
                    if (!profile) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                    const isInGroup = await Group.findOne({ members: profile.id, 'channels': id });
                    if (!isInGroup) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                }
                await channel?.populate({
                    path: 'messages',
                    options: { limit: limit, sort: { date: 'descending' } }
                });
                console.log("CHANNEL: ", channel);
                return channel?.messages;
            })
            .post('/:id/send', async ({ jwt, set, query, body, params: { id } }) => {
                const profile = await jwt.verify(query.token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const channel = await Channel.findOne({ "id.id": id });
                const amityId = new AmityId({ id: profile.id, server: Bun.env.SERVER_URL })
                const message = new Message({
                    date: body.date,
                    author_id: amityId,
                    encrypted: body.encrypted,
                    content: body.content,
                    contents: body.contents
                });
                await message.save();
                channel?.messages.push(message);
                await channel?.save();
            }, {
                body: t.Object({
                    date: t.Date(),
                    encrypted: t.Boolean(),
                    content: t.Optional(t.String()),
                    contents: t.Optional(t.Array(t.Object({
                        for: t.Object({
                            id: t.String(),
                            server: t.String()
                        }),
                        content: t.String()
                    })))
                })
            })
    )
    .group('/group', (app) =>
        app
            .post('/create', async ({ jwt, set, query, body: { name, icon, description, is_public, has_channels, channels } }) => {
                const profile = await jwt.verify(query.token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const user = await User.findOne({ _id: profile._id })
                if (!user) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                console.log("PROFILE: ", profile);
                const randomid = randomID();
                const amityId = new AmityId({ id: randomid, server: Bun.env.SERVER_URL })
                const mcRandomid = randomID();
                const mcannelAmityId = new AmityId({ id: mcRandomid, server: Bun.env.SERVER_URL })

                const group = new Group({
                    id: amityId,
                    name: name,
                    icon: icon || "https://nrd.neg-zero.com/Dobby.png",
                    description: description || "",
                    is_public: is_public,
                    has_channels: has_channels,
                    members: [user.id.id],
                    owner_id: user.id.id,
                    channels: channels?.map((e: { type: string, name: string, icon: string }) => {
                        const chRandomid = randomID();
                        const channelAmityId = new AmityId({ id: chRandomid, server: Bun.env.SERVER_URL })
                        return {
                            id: channelAmityId,
                            type: e.type,
                            name: e.name,
                            icon: e.icon
                        }
                    }) || [{
                        id: mcannelAmityId,
                        type: "text",
                        name: "General",
                        icon: "https://nrd.neg-zero.com/Dobby.png"
                    }]
                })
                await group.save();
                const owner = await User.findOne({ _id: profile._id });
                owner?.chats.push({ chat_type: "group", id: amityId });
                await owner?.save();
                return JSON.stringify(group);
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
            .get('/:id/info', async ({ jwt, set, query, params: { id } }) => {
                const profile = await jwt.verify(query.token)
                const group = await Group.findOne({ 'id.id': id });
                if (!group?.is_public) {
                    if (!profile) {
                        set.status = 401;
                        return 'Unauthorized';
                    }

                    if (group?.members.findIndex(e => e.id as string == profile.id && e.server as string == server) == -1) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                }
                await group?.populate({
                    path: "channels",
                    select: "-messages"
                });
                return JSON.stringify(group);
            })
            .get("/:id/messages", async ({ jwt, set, query, params: { id } }) => {
                const profile = await jwt.verify(query.token)
                const limit = Number(query.limit) < 100 ? Number(query.limit) : 100;
                const group = await Group.findOne({ "id.id": id });
                if (!group) {
                    set.status = 404;
                    return 'Group not found';
                }
                const mcRandomid = randomID();
                const mcannelAmityId = new AmityId({ id: mcRandomid, server: Bun.env.SERVER_URL })
                const nc = new Channel({
                    id: mcannelAmityId,
                    type: "text",
                    name: "General",
                    icon: "https://nrd.neg-zero.com/Dobby.png",
                    messages: [
                        new Message({
                            date: new Date(),
                            author_id: profile.id,
                            encrypted: false,
                            content: "Welcome to the group!",
                            contents: []
                        })
                    ]
                })
                await nc.save()
                if (group.channels.length != 1) {
                    group.channels.push(nc._id)
                    await group.save()
                }
                await group?.populate({
                    path: "channels",
                    select: "-messages"
                });
                const channel = await group?.channels[0];
                console.log("CHANNEL: ", channel);
                console.log("GROUP: ", group);
                if (!group?.is_public) {
                    if (!profile) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                    const isInGroup = await Group.findOne({ members: profile.id, 'channels': id });
                    if (!isInGroup) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                }
                await channel?.populate({
                    path: 'messages',
                    options: { limit: limit, sort: { date: 'descending' } }
                });
                console.log("CHANNEL: ", channel);
                return channel?.messages;
            })
            .post("/:id/send", async ({ params: { id }, jwt, set, body, query, error }) => {
                const profile = await jwt.verify(query.token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const group = await Group.findOne({ "id.id": id });
                if (group?.has_channels) return error(500);
                await group?.populate({
                    path: "channels",
                    select: "-messages"
                });
                const channel = group?.channels[0];
                const amityId = new AmityId({ id: profile.id, server: Bun.env.SERVER_URL })
                const message = new Message({
                    date: body.date,
                    author_id: amityId,
                    encrypted: body.encrypted,
                    content: body.content,
                    contents: body.contents
                });
                await message.save();
                channel?.messages.push(message);
                await channel?.save();
            }, {
                body: t.Object({
                    date: t.Date(),
                    encrypted: t.Boolean(),
                    content: t.Optional(t.String()),
                    contents: t.Optional(t.Array(t.Object({
                        for: t.Object({
                            id: t.String(),
                            server: t.String()
                        }),
                        content: t.String()
                    })))
                })
            })
    )
    .listen(Bun.env.PORT ?? 3000);


mongoose.connect(Bun.env.MONGODB_URL ?? "");

console.log(
    `amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);