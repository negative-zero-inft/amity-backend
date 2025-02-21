import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { User } from './schema/user';
import { AmityId } from './schema/amityId';
import { randomID } from './utils';
import { ChatFolder } from './schema/chatFolder';

export const user = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '7d'
        })
    )
    .group("/user", (app) =>
        app
            .get('/:id/info', async ({ jwt, set, params: { id } }) => {
                const user = await User.findOne({ 'id.id': id });
                console.log(user);
                delete user!.password;

                return user;
            })
            .group("/me", (app) =>
                app
                    .get('/', async ({ jwt, set, query }) => {
                        const profile = await jwt.verify(query.token)
                        if (!profile) {
                            set.status = 401;
                            return 'Unauthorized';
                        }
                        const user = await User.findOne({ 'id.id': profile.id });
                        delete user!.password;

                        return JSON.stringify(user);
                    })
                    .put("/", async ({ jwt, set, query, body }) => {
                        const profile = await jwt.verify(query.token)
                        if (!profile) {
                            set.status = 401;
                            return 'Unauthorized';
                        }
                        await User.findOneAndUpdate({ "id.id": profile.id }, body);
                    }, {
                        body: t.Object({
                            //this should update the user data with new stuff
                            name: t.String(),
                            description: t.String(),
                            avatar: t.String(),
                            banner: t.String(),
                        })
                    })
                    .group("/chatfolders", (app) =>
                        app.get("/", async ({ jwt, set, query }) => {
                            const profile = await jwt.verify(query.token)
                            if (!profile) {
                                set.status = 401;
                                return 'Unauthorized';
                            }
                            const user = await User.findOne({ _id: profile._id });
                            return JSON.stringify(user?.chat_folders);
                        })
                            .post("/add", async ({ jwt, set, query, body: { icon, name } }) => {
                                const profile = await jwt.verify(query.token)
                                if (!profile) {
                                    set.status = 401;
                                    return 'Unauthorized';
                                }
                                const user = await User.findOne({ _id: profile._id });
                                const chatFolder = new ChatFolder({
                                    icon: icon,
                                    name: name
                                })
                                user?.chat_folders.push(chatFolder);
                                await user?.save();
                                return JSON.stringify(chatFolder);
                            }, {
                                body: t.Object({
                                    icon: t.String(),
                                    name: t.String()
                                })
                            })
                            .delete("/", async({jwt, set, query, body: {name}}) => {
                                const profile = await jwt.verify(query.token)
                                if (!profile) {
                                    set.status = 401;
                                    return 'Unauthorized';
                                }
                                const user = await User.findOne({_id: profile._id});
                                user?.chat_folders.pull({name: name});
                                await user?.save();
                                return;
                            }, {
                                body: t.Object({
                                    name: t.String()
                                })
                            })
                    )
            )
    )