import { t, Elysia } from "elysia";
import { jwt } from '@elysiajs/jwt'
import { randomID } from './utils';
import { google } from "./oauth/google"
import { sql } from "./sql";
import { github } from "./oauth/github";

console.log(process.env.POSTGRES_URL)
const server = process.env.SERVER_URL ?? "";

const app = new Elysia()
	.use(
		jwt({
			name: 'jwt',
			secret: process.env.JWT_SECRET ?? "asd",
			exp: '1d'
		})
	)
	.get("/", () => "loqa")
	.group("/auth", (app) =>
		app
	.use(google)
	.use(github)
	)
	.post('/register', async ({ set, body: { password, tag, name, avatar } }) => {
		const randomid = randomID();
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
		const usr = tag.split("@")
		if(usr[1] != server){
			set.status = 401; 
			return "Incorrect instance";
		}	
		const [user] = await sql`SELECT * FROM users WHERE tag = ${usr[0]}`;
		if (!user) {
			set.status = 401;
			return 'Unauthorized';
		}
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
		.get("/:id/channels", async ({ jwt, set, query, params: { id } }) => {
			const profile = await jwt.verify(query.token)
			if (!profile) {
				set.status = 401;
				return 'Unauthorized';
			}
			const [user] = await sql`SELECT * FROM users WHERE id = ${profile.id}`;
			const [groups] = await sql`SELECT id FROM groups WHERE ${user.id} = ANY(members) AND id = ${id}`.values();
			console.log(groups);
			if (!groups) {
				set.status = 401;
				return 'Unauthorized';
			}
			
			let [[channels]] = await sql`SELECT channels FROM groups WHERE id = ${id}`.values();
			console.log(channels)
			
			return channels.match(/[\w.-]+/g).map(String); //converts a postgres array to a JS one
		})
		.get('/:id/info', async ({ jwt, set, query, params: { id } }) => {
			const profile = await jwt.verify(query.token)
			if (!profile) {
				set.status = 401;
				return 'Unauthorized';
			}
			const [user] = await sql`SELECT * FROM users WHERE id = ${profile.id}`;
			let [group] = await sql`SELECT * FROM groups WHERE ${user.id} = ANY(members) AND id = ${id}`;
			group.channels = group.channels.match(/[\w.-]+/g).map(String);
			group.members = group.members.match(/[\w.-]+/g).map(String);
			return group;
		})
	)
.listen(3000);


console.log(
	`amity-backend is running at ${app.server?.hostname}:${app.server?.port}`
);
