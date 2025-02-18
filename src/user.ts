import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { User } from './schema/user';

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
                const user = await User.findOne({ id: id });
                delete user!.email;
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
                        const user = await User.findOne({ id: profile.id });
                        delete user!.password;

                        return user;
                    })
                    .put("/", async ({ jwt, set, query }) => { }, {
                        body: t.Object({
                            //this should update the user data with new stuff
                        })
                    })
            )
    )