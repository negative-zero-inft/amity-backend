import { t, Elysia } from "elysia";
import { jwt } from '@elysiajs/jwt'
import { SQL } from "bun";

console.log(process.env.POSTGRES_URL)
const sql = new SQL(new URL(process.env.POSTGRES_URL ?? ""));

function randomID() {
  const chars = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars[Math.round(Math.random() * 100 % 36)];
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

  .listen(3000);


console.log(
  `amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);
