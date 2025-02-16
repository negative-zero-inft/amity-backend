import { SQL } from "bun";

const connection = new SQL(new URL(process.env.POSTGRES_URL ?? ""));
export const sql = connection;