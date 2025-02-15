import { t, Elysia } from "elysia";
import { jwt } from '@elysiajs/jwt'
import { SQL } from "bun";

console.log(process.env.POSTGRES_URL)
const sql = new SQL(new URL(process.env.POSTGRES_URL ?? ""));

function randomID() {
  const chars = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars[Math.round(Math.random() * 100 % 35)];
  }
  return result;
}

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? "asd",
      exp: '1d'
    })
  )
  .get("/", () => "loqa")
  .post('/register', async ({ set, body: { password, tag, name, avatar } }) => {
    if (tag.split("@").length > 1) {
      set.status = 400;
      return "Bad request";
    }
    const server = tag.split("@")[1];
    const randomid = randomID();
    console.log(randomid, server);
    await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${server})`;
    await sql`INSERT INTO users (id, tag, name, password, avatar) VALUES 
    (${randomid}, ${tag}, ${name}, ${await Bun.password.hash(password)}, ${avatar})`;
  }, {
    body: t.Object({
      tag: t.String(),
      password: t.String(),
      name: t.String(),
      avatar: t.String()
    })
  })
  .post('/signin', async ({ jwt, set, body: { tag, password } }) => {
    const users = await sql`SELECT * FROM users WHERE tag = ${tag}`;
    if (users.length <= 0) {
      set.status = 500;
      return `could not find user`;
    }
    const user = users[0];
    const isMatch = await Bun.password.verify(password, user.password);
    if (!isMatch) {
      set.status = 403;
      return `wrong password`;
    }

    return await jwt.sign({ id: user.id })
  }, {
    body: t.Object({
      tag: t.String(),
      password: t.String(),
    })
  })
  .get('/profile', async ({ jwt, set, query }) => {

    const profile = await jwt.verify(query.token)

    if (!profile) {
      set.status = 401;
      return 'Unauthorized';
    }

    return profile.id
  })
  .group('/channel', (app) =>
    app
      .post('/create', async ({ jwt, set, body: { token, group_id, type, name, icon_id } }) => {
        const profile = await jwt.verify(token)
        if (!profile) {
          set.status = 401;
          return 'Unauthorized';
        }
        const users = await sql`SELECT * FROM users WHERE id = ${profile.id}`;
        const user = users[0];
        const server = user.tag.split("@")[1];
        const randomid = randomID();

        await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${server})`;
        await sql`INSERT INTO channels (id, type, name, icon_id) VALUES 
        (${randomid}, ${type}, ${name}, ${icon_id})`;
        await sql`UPDATE groups SET channels = array_append(channels, ${randomid}) WHERE id = ${group_id}`

      }, {
        body: t.Object({
          token: t.String(),
          type: t.Number(),
          name: t.String(),
          group_id: t.String(),
          icon_id: t.Optional(t.String())
        })
      })
      .get('/:id/info', async ({ jwt, set }) => {

      })
      .post('/:id/send', async ({ jwt, set }) => {

      })
  )
  .group('/group', (app) =>
    app
      .post('/create', async ({ jwt, set, body: { token, name, icon, description, is_public, has_channels } }) => {
        const profile = await jwt.verify(token)
        if (!profile) {
          set.status = 401;
          return 'Unauthorized';
        }
        const users = await sql`SELECT * FROM users WHERE id = ${profile.id}`;
        const user = users[0];
        const server = user.tag.split("@")[1];
        const randomid = randomID();

        await sql`INSERT INTO amity_id (id, server) VALUES (${randomid}, ${server})`;
        await sql`INSERT INTO groups (id, name, icon, description, is_public, has_channels, members, owner_id) VALUES 
        (${randomid}, ${name}, ${icon}, ${description}, ${is_public}, ${has_channels}, ARRAY[${profile.id}], ${profile.id})`;

      }, {
        body: t.Object({
          token: t.String(),
          name: t.String(),
          icon: t.Optional(t.String()),
          description: t.Optional(t.String()),
          is_public: t.Boolean(),
          has_channels: t.Boolean(),
        })
      })
      .get("/:id/channels", async ({ jwt, set, query, params: {id} }) => {
        const profile = await jwt.verify(query.token)
        if (!profile) {
          set.status = 401;
          return 'Unauthorized';
        }
        console.log("asd")
        const users = await sql`SELECT * FROM users WHERE id = ${profile.id}`;
        const user = users[0];

        const [groups] = await sql`SELECT id FROM groups WHERE ${user.id} = ANY(members)`.values();
        console.log(groups);
        if(!groups.includes(id)) {
          set.status = 401;
          return 'Unauthorized';
        }

        let [[channels]] = await sql`SELECT channels FROM groups WHERE id = ${id}`.values();
        console.log(channels)

        return channels.match(/[\w.-]+/g).map(String);
      })
      .get('/:id/info', async ({ jwt, set, params: {id} }) => {

      })
  )
  .listen(3000);


console.log(
  `amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);
