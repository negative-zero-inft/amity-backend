import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { sql } from "./sql";

export const osu = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '1d'
        })
    )
    .group("/user", (app) =>
        app
            .get('/:id/info', async ({ jwt, set, params: {id} }) => {
            
            })
            .group("/me", (app) =>
                app
                    .get('/', async ({ jwt, set, query }) => { 

                    })
        )
    )