import { Elysia, t } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomID } from './utils';
import { User } from './schema/user';
import { AmityId } from './schema/amityId';
import { Channel } from './schema/channel';
import { Chat } from './schema/chat';

export const dm = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '1d'
        })
    )
    .group("/dm", (app) =>
        app.post("/create", async ({ query, jwt, set, body: {user_id} }) => {
                const profile = await jwt.verify(query.token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const randomid = randomID();

                const currentUser = await User.findOne({_id: profile._id});
                const foreignUser = await User.findOne({'id.id': user_id});
                const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })
                const chat = new Chat({
                    id: amityId
                });
                await chat.save();
                currentUser?.chats.push(chat);
                foreignUser?.chats.push(chat);
                await currentUser?.save();
                await foreignUser?.save();
                return JSON.stringify(chat);
        }, {
            body: t.Object({
                user_id: t.String(), //amity id
            })
        })
        .get("/chats", async ({ query, jwt, set }) => {
            const profile = await jwt.verify(query.token)
            if (!profile) {
                set.status = 401;
                return 'Unauthorized';
            }
            const user = await User.findOne({_id: profile._id});
            return JSON.stringify(user?.chats);
        })
    )