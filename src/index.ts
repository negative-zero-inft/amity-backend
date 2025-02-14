import { Elysia } from "elysia";
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: 'rghuoierhgiudrhgiure',
      exp: '1d'
    })
  )
  .get("/", () => "loqa")
  .get('/signin', async ({ jwt, set, query }) => {
    if(!query.name) {
      set.status = 400;
      return "Bad request";
    }
    return await jwt.sign({name: query.name ?? "nuh"})
  })
  .get('/profile', async ({ jwt, set, query }) => {
    
    const profile = await jwt.verify(query.token)

    if (!profile) {
      set.status = 401;
      return 'Unauthorized';
    }

    return `Hello ${profile.name}`
  })

  .listen(3000);


console.log(
  `amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);
