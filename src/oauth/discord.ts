import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomChars, randomID } from '../utils';
import { User } from '../schema/user';
import { AmityId } from '../schema/amityId';
import { AwaitingConnection } from '../schema/awaitingConnection';

export const discord = new Elysia()
    .use(
        oauth2({
            Discord: [
                process.env.DISCORD_ID ?? "",
                process.env.DISCORD_SECRET ?? "",
                `http://${process.env.SERVER_URL}:3000/auth/discord/callback`
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
        app.get("/", async ({ oauth2, redirect, jwt, set, query }) => {
            const url = oauth2.createURL("Discord", ["email", "identify"]);
            if (query.token) {
                const profile = await jwt.verify(query.token);
                if (!profile) {
                    set.status = 401;
                    return "Unauthorized";
                }
                console.log("user set");
                const connection = new AwaitingConnection({
                    name: "github",
                    secret: url.searchParams.get("state"),
                    user: profile._id
                })
                await connection.save();
            }
            url.searchParams.set("access_type", "offline");

            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt, query }) => {
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
                const connection = await AwaitingConnection.findOne({ name: "discord", secret: query.state });
                if (connection) {
                    const user = await User.findOne({ _id: connection.user });
                    user?.connections.push({
                        name: "discord",
                        secret: email
                    })
                    await user?.save();
                    await AwaitingConnection.deleteOne({ _id: connection._id });
                    return await jwt.sign({ id: user?.id.id, _id: user?._id.toString() })
                }
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
                    return await jwt.sign({ id: randomid, _id: user._id });
                } else {
                    return await jwt.sign({ id: userId.id.id, _id: userId._id.toString() })
                }
            })
    )