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
                                if(!icon && !name){
                                    set.status = 400;
                                    return "You must include either the name or the icon"
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
                                    icon: t.Optional(t.String()),
                                    name: t.Optional(t.String())
                                })
                            })
                            .put("/", async({jwt, set, query, error, body}) => {
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
                                        if(body.elements) 
                                            folder.elements = body.elements;

                                    }
                                }
                            }, {
                                body: t.Object({
                                    _id: t.String(),
                                    icon: t.String(),
                                    name: t.String(),
                                    elements: t.Optional(t.Array(t.Object({
                                        chat_type: t.String(),
                                        amity_id: t.Object({
                                            id: t.String(),
                                            server: t.String()
                                        })
                                    })))
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
            )
    )