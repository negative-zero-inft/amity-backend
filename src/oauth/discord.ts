import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomChars, randomID } from '../utils';
import { User } from '../schema/user';
import { AmityId } from '../schema/amityId';

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
                const userId = await User.findOne({ "connections.name": "discord", "connections.secret": email });
                if (!userId) {
                    //create a user
                    const randomid = randomID();
                    const tag = discordUser.username + randomChars(5);

                    const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })


                    const user = new User({
                        id: amityId,
                        tag: tag,
                        name: tag,
                        avatar: picture,
                        email: email,
                        connections: [{
                            name: "discord",
                            secret: email
                        }]
                    });
                    await user.save();
                    return await jwt.sign({ id: randomid });
                } else {
                    return await jwt.sign({ id: userId.id.id, _id: user._id.toString() })
                }
            })
    )