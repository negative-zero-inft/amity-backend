import { t, Elysia } from "elysia";
import { jwt } from '@elysiajs/jwt'
import { randomID } from './utils';
import { google } from "./oauth/google"
import { github } from "./oauth/github";
import { discord } from "./oauth/discord";
import { osu } from "./oauth/osu";
import { user } from "./user";
import { User } from "./schema/user";
import { Group } from "./schema/group";
import { Channel } from "./schema/channel";
import { AmityId } from "./schema/amityId";
import mongoose from "mongoose";
import { Message } from "./schema/message";
import { dm } from "./dm";
import { cors } from "@elysiajs/cors";

console.log(process.env.POSTGRES_URL)
const server = process.env.SERVER_URL ?? "";

const app = new Elysia()
    .use(cors({}))
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '1d'
        })
    )
    .get("/", () => "loqa")
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

        const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })

        const user = new User({
            id: amityId,
            tag: tag,
            name: name,
            banner: "https://cdn.discordapp.com/attachments/1093616425198956655/1343342051143581777/Jump-1080.png?ex=67bcec47&is=67bb9ac7&hm=e234e6c2014b98d6cfb570362a307f333b81dea9eb366d6543b48606f9d664a1&",
            avatar: "skibidi.pneumonoultramicroscopicsilicovolcanoconiosis.site",
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

                const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })
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
                const channel = await Channel.findOne({"id.id": id});
                const amityId = new AmityId({ id: profile.id, server: process.env.SERVER_URL })
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
            .post('/create', async ({ jwt, set, body: { token, name, icon, description, is_public, has_channels } }) => {
                const profile = await jwt.verify(token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const randomid = randomID();
                const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })

                const group = new Group({
                    id: amityId,
                    name: name,
                    icon: icon,
                    description: description,
                    is_public: is_public,
                    has_channels: has_channels,
                    members: [profile._id],
                    owner_id: profile._id
                })
                await group.save();
                return JSON.stringify(group);
            }, {
                body: t.Object({
                    token: t.String(),
                    name: t.String(),
                    icon: t.Optional(t.String()),
                    description: t.Optional(t.String()),
                    is_public: t.Boolean(),
                    has_channels: t.Boolean(),
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
                    const isInGroup = await Group.findOne({ members: profile.id, 'id.id': id });
                    if (!isInGroup) {
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
    )
    .listen(3000);


mongoose.connect(process.env.MONGODB_URL ?? "");

console.log(
    `amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);