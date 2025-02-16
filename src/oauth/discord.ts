import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { sql } from "../sql";
import { randomID } from '../utils';

export const discord = new Elysia()
    .use(
        oauth2({
            Discord: [
                process.env.DISCORD_ID ?? "",
                process.env.DISCORD_SECRET ?? "",
                `http://${process.env.SERVER_URL}/auth/discord/callback`
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
    .group("/discord", (app) =>
        app.get("/", async ({ oauth2, redirect }) => {
            const url = oauth2.createURL("Discord", ["email", "identify"]);
            url.searchParams.set("access_type", "offline");

            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt }) => {
                const tokens = await oauth2.authorize("Discord");
                const accessToken = tokens.accessToken();

                const response = await fetch("https://discord.com/api/users/@me", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const discordUser = await response.json();

                const email = discordUser.email;
                const picture = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp`;
                const [user] = await sql`SELECT id FROM users WHERE email = ${email}`;
                console.log(user);
                if (!user) {
                    //create a user
                    const randomid = randomID();
                    const tag = discordUser.username;

                    await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${process.env.SERVER_URL})`;
                    await sql`INSERT INTO users (id, tag, name, avatar, email) VALUES 
              (${randomid}, ${tag}, ${tag}, ${picture}, ${email})`;
                    return await jwt.sign({ id: randomid });
                } else return await jwt.sign({ id: user.id })
            })
    )