import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { sql } from "../sql";
import { randomID } from '../utils';

export const google = new Elysia()
    .use(
        oauth2({
            Google: [
                process.env.GOOGLE_ID ?? "",
                process.env.GOOGLE_SECRET ?? "",
                `http://${process.env.SERVER_URL}/auth/google/callback`
            ]
        })
    )
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET ?? "asd",
            exp: '1d'
        })
    )
    .group("/google", (app) =>
        app.get("/", async ({ oauth2, redirect }) => {
            const url = oauth2.createURL("Google", ["email"]);
            url.searchParams.set("access_type", "offline");

            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt }) => {
                const tokens = await oauth2.authorize("Google");

                const accessToken = tokens.accessToken();
                const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const { email, picture } = await response.json();
                const [userId] = await sql`SELECT id FROM connections WHERE identifier = ${email} AND name = 'google'`;
                if (!userId) {
                    //create a user
                    const randomid = randomID();
                    const tag = email.split("@")[0];

                    await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${process.env.SERVER_URL})`;
                    await sql`INSERT INTO users (id, tag, name, avatar, email) VALUES 
                    (${randomid}, ${tag}, ${tag}, ${picture}, ${email})`;
                    await sql`INSERT INTO connections (id, name, identifier) VALUES (${randomid}, 'google', ${email})`;
                    return await jwt.sign({ id: randomid });
                } else return await jwt.sign({ id: userId })
            })
    )