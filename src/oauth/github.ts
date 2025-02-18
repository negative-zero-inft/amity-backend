import { Elysia } from 'elysia'
import { oauth2 } from "elysia-oauth2";
import { jwt } from '@elysiajs/jwt'
import { randomID } from '../utils';
import { User } from '../schema/user';
import { AmityId } from '../schema/amityId';

export const github = new Elysia()
    .use(
        oauth2({
            GitHub: [
                process.env.GITHUB_ID ?? "",
                process.env.GITHUB_SECRET ?? "",
                `http://${process.env.SERVER_URL}/auth/github/callback`
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
        app.get("/", async ({ oauth2, redirect }) => {
            const url = oauth2.createURL("GitHub", ["user:email"]);
            url.searchParams.set("access_type", "offline");

            return redirect(url.href);
        })
            .get("/callback", async ({ oauth2, jwt }) => {
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
                const userId = await User.findOne({"connections.name": "github", "connections.secret": email});
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
                    return await jwt.sign({ id: randomid });
                } else return await jwt.sign({ id: userId.id.id, _id: user._id.toString() })
            })
    )