import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomID } from '../utils';
import { User } from '../schemas/user';
import { AmityId } from '../schemas/amityId';
import { AwaitingConnection } from '../schemas/awaitingConnection';

export const github = new Elysia()
    .use(
        oauth2({
            GitHub: [
                process.env.GITHUB_ID ?? "",
                process.env.GITHUB_SECRET ?? "",
                `https://${process.env.SERVER_URL}:3000/auth/github/callback`
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
    .group("/github", (app) =>
        app.get("/", async ({ oauth2, redirect, query, jwt, set }) => {
            const url = oauth2.createURL("GitHub", ["user:email"]);
            if(query.token) {
                const profile = await jwt.verify(query.token);
                if(!profile) {
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
            .get("/callback", async ({ oauth2, jwt, query, redirect }) => {
                const tokens = await oauth2.authorize("GitHub");
                const accessToken = tokens.accessToken();

                const response = await fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    }
                })
                const data = await response.json();

                const mailResponse = await fetch("https://api.github.com/user/emails", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    }
                })
                const emails = await mailResponse.json();
                console.log(emails);

                const email = emails[0]["email"];
                console.log(email)
                const picture = data.avatar_url;
                const connection = await AwaitingConnection.findOne({ name: "github", secret: query.state });
                if (connection) {
                    const user = await User.findOne({ _id: connection.user });
                    user?.connections.push({
                        name: "github",
                        secret: email
                    })
                    await user?.save();
                    await AwaitingConnection.deleteOne({ _id: connection._id });
                    return await jwt.sign({ id: user?.id.id, _id: user?._id.toString() })
                }
                const userId = await User.findOne({ "connections.name": "github", "connections.secret": email });
                if (!userId) {
                    //create a user
                    const randomid = randomID();
                    const tag = email.split("@")[0];

                    const amityId = new AmityId({ id: randomid, server: process.env.SERVER_URL })

                    const user = new User({
                        id: amityId,
                        tag: tag,
                        name: tag,
                        avatar: picture,
                        email: email,
                        connections: [{
                            name: "github",
                            secret: email
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