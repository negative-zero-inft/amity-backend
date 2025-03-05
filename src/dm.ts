import { Elysia, t } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomID } from './utils';
import { User } from './schemas/user';
import { AmityId } from './schemas/amityId';
import { Channel } from './schemas/channel';
import { Chat } from './schemas/chat';
import { Message } from './schemas/message';
import { Group } from './schemas/group';

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
                const foreignUser = await User.findOne({'id.id': user_id.id});
                if(!foreignUser) {
                    //the user isn't registered on our server
                    
                }
                const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })
                const chat = new Chat({
                    id: amityId
                });
                await chat.save();
                currentUser?.chats.push({chat_type: "dm", id: amityId});
                // foreignUser?.chats.push(chat);
                await currentUser?.save();
                // await foreignUser?.save();
                return JSON.stringify(chat);
        }, {
            body: t.Object({
                user_id: t.Object({ //amity_id
                    id: t.String(),
                    server: t.String()
                }), 
            })
        })
        .post("/:id/send", async ({ jwt, set, query, body, params: {id}}) => {
                const profile = await jwt.verify(query.token)
                if (!profile) {
                    set.status = 401;
                    return 'Unauthorized';
                }
                const chat = await Chat.findOne({"id.id": id});
                const amityId = new AmityId({ id: profile.id, server: process.env.SERVER_URL })
                const message = new Message({
                    date: body.date,
                    author_id: amityId,
                    encrypted: body.encrypted,
                    content: body.content,
                    contents: body.contents
                });
                await message.save();
                chat?.messages.push(message);
                await chat?.save();
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