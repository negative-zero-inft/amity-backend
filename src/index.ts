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

console.log(process.env.POSTGRES_URL)
const server = process.env.SERVER_URL ?? "";

const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '1d'
        })
    )
    .get("/", () => "loqa")
    .use(user)
    .group("/auth", (app) =>
        app
            .use(google)
            .use(github)
            .use(discord)
            .use(osu)
    )
    .post('/register', async ({ set, body: { password, tag, name } }) => {
        const randomid = randomID();
        // await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${server})`;
        // await sql`INSERT INTO users (id, tag, name, password, avatar) VALUES 
        // (${randomid}, ${tag}, ${name}, ${await Bun.password.hash(password)}, ${avatar})`;

        const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })

        const user = new User({
            id: amityId,
            tag: tag,
            name: name,
            avatar: "https://media.discordapp.net/attachments/1339688907679465472/1341490498824835163/appicon.png?ex=67b62fe2&is=67b4de62&hm=4401408bdeb715575d0df621070cba094995c3c40ddf1b98bf0cecec1c656588&=&format=webp&quality=lossless&width=672&height=672",
            password: await Bun.password.hash(password)
        });
        await user.save();
    }, {
        body: t.Object({
            tag: t.String(),
            password: t.String(),
            name: t.String(),
            avatar: t.String()
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

                group?.channels.push(channel);
                await group?.save();
                return channel;
            }, {
                body: t.Object({
                    token: t.String(),
                    type: t.Number(),
                    name: t.String(),
                    group_id: t.String(),
                    icon_id: t.Optional(t.String())
                })
            })
            .post('/:id/send', async ({ jwt, set }) => {

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
                return group;
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
                return group;
            })
    )
    .listen(3000);


mongoose.connect(process.env.MONGODB_URL ?? "");

console.log(
    `amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);