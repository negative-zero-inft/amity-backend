import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomID } from '../utils';
import { User } from '../schema/user';
import { AmityId } from '../schema/amityId';
import { AwaitingConnection } from '../schema/awaitingConnection';

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
        app.get("/", async ({ jwt, oauth2, redirect, query, set }) => {
            const url = oauth2.createURL("Google", ["email"]);
            url.searchParams.set("access_type", "offline");
            if(query.token) {
                const profile = await jwt.verify(query.token);
                if(!profile) {
                    set.status = 401;
                    return "Unauthorized";
                }
                console.log("user set");
                const connection = new AwaitingConnection({
                    name: "google",
                    secret: url.searchParams.get("state"),
                    user: profile._id
                })
                await connection.save();
            }
            console.log(url.href);


            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt, query }) => {
                const tokens = await oauth2.authorize("Google");
                const accessToken = tokens.accessToken();
                const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const { email, picture } = await response.json();
                const connection = await AwaitingConnection.findOne({name: "google", secret: query.state});
                if(connection) {
                    const user = await User.findOne({_id: connection.user});
                    user?.connections.push({
                        name: "google",
                        secret: email
                    })
                    await user?.save();
                    await AwaitingConnection.deleteOne({_id: connection._id});
                    return await jwt.sign({ id: user?.id.id, _id: user?._id.toString() })
                }
                const userId = await User.findOne({"connections.name": "google", "connections.secret": email});
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
                            name: "google",
                            secret: email
                        }]
                    });
                    await user.save();
                    return await jwt.sign({ id: randomid, _id: user._id });
                } else return await jwt.sign({ id: userId.id.id, _id: userId._id.toString() })
            })
    )