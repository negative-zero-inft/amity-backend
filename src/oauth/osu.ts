import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { sql } from "../sql";
import { randomID, randomChars } from '../utils';

export const osu = new Elysia()
    .use(
        oauth2({
            Osu: [
                process.env.OSU_ID ?? "",
                process.env.OSU_SECRET ?? "",
                `http://${process.env.SERVER_URL}/auth/osu/callback`
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
    .group("/osu", (app) =>
        app.get("/", async ({ oauth2, redirect }) => {
            const url = oauth2.createURL("Osu", ["public"]);
            url.searchParams.set("access_type", "offline");

            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt }) => {
                const tokens = await oauth2.authorize("Osu");
                const accessToken = tokens.accessToken();

                const response = await fetch("https://osu.ppy.sh/api/v2/me", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const osuUser = await response.json();
                console.log(osuUser);

                const username = osuUser.username, picture = osuUser.avatar_url;
                const [userId] = await sql`SELECT id FROM connections WHERE identifier = ${username} AND name = 'osu'`;
                if (!userId) {
                    //create a user
                    const randomid = randomID();
                    const tag = username + randomChars(5);

                    await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${process.env.SERVER_URL})`;
                    await sql`INSERT INTO users (id, tag, name, avatar) VALUES 
                    (${randomid}, ${tag}, ${tag}, ${picture})`;
                    await sql`INSERT INTO connections (id, name, identifier) VALUES (${randomid}, 'osu', ${username})`;
                    return await jwt.sign({ id: randomid });
                } else {
                    return await jwt.sign({ id: userId })
                }
            })
    )