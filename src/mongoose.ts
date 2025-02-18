import * as goose from 'mongoose';

const mongo = await goose.connect(process.env.MONGODB_URL ?? "");
export const mongoose = mongo;