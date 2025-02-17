import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { sql } from "./sql";

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
                const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
                delete user.email;
                delete user.password;

                const fields = ['followers', 'follows', 'public_channels'];
                for (const field of fields) {
                    if (user[field]) {
                        user[field] = user[field].match(/[\w.-]+/g).map(String);
                    }
                }

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
                        const [user] = await sql`SELECT * FROM users WHERE id = ${profile.id}`;
                        delete user.password;

                        const fields = ['followers', 'follows', 'public_channels'];
                        for (const field of fields) {
                            if (user[field]) {
                                user[field] = user[field].match(/[\w.-]+/g).map(String);
                            }
                        }

                        return user;
                    })
                    .put("/", async ({ jwt, set, query}) => {}, {
                        body: t.Object({
                            
                        })
                    })
            )
    )