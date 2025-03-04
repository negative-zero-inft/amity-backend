import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomID, randomChars } from '../utils';
import { User } from '../schemas/user';
import { AmityId } from '../schemas/amityId';
import { AwaitingConnection } from '../schemas/awaitingConnection';

export const osu = new Elysia()
    .use(
        oauth2({
            Osu: [
                process.env.OSU_ID ?? "",
                process.env.OSU_SECRET ?? "",
                `https://${process.env.SERVER_URL}:3000/auth/osu/callback`
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
        app.get("/", async ({ oauth2, redirect, jwt, query, set }) => {
            const url = oauth2.createURL("Osu", ["public"]);
            if (query.token) {
                const profile = await jwt.verify(query.token);
                if (!profile) {
                    set.status = 401;
                    return "Unauthorized";
                }
                console.log("user set");
                const connection = new AwaitingConnection({
                    name: "osu",
                    secret: url.searchParams.get("state"),
                    user: profile._id
                })
                await connection.save();
            }
            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt, query, redirect }) => {
                const tokens = await oauth2.authorize("Osu");
                console.log(query);
                const accessToken = tokens.accessToken();

                const response = await fetch("https://osu.ppy.sh/api/v2/me", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const osuUser = await response.json();
                console.log(osuUser);

                const username = osuUser.username, picture = osuUser.avatar_url;
                const connection = await AwaitingConnection.findOne({ name: "osu", secret: query.state });
                if (connection) {
                    const user = await User.findOne({ _id: connection.user });
                    user?.connections.push({
                        name: "osu",
                        secret: username
                    })
                    await user?.save();
                    await AwaitingConnection.deleteOne({ _id: connection._id });
                    return await jwt.sign({ id: user?.id.id, _id: user?._id.toString() })
                }
                const userId = await User.findOne({ "connections.name": "osu", "connections.secret": username });
                if (!userId) {
                    //create a user
                    const randomid = randomID();
                    const tag = username + randomChars(5);

                    const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })

                    const user = new User({
                        id: amityId,
                        tag: tag,
                        name: tag,
                        avatar: picture,
                        connections: [{
                            name: "osu",
                            secret: username
                        }]
                    });
                    await user.save();
                    const token = await jwt.sign({ id: randomid, _id: user._id.toString() });
                    return redirect(`https://${Bun.env.SERVER_URL}/oauth?token=${token}&server=${Bun.env.SERVER_URL}`)
                } else {
                    const token = await jwt.sign({ id: userId.id.id, _id: userId._id.toString() })
                    return redirect(`https://${Bun.env.SERVER_URL}/oauth?token=${token}&server=${Bun.env.SERVER_URL}`)
                }
            })
    )