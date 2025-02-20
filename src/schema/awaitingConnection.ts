import * as mongoose from 'mongoose';

const awaitingConnection = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    secret: String,
});

export type AwaitingConnection = mongoose.InferSchemaType<typeof awaitingConnection>;
export const AwaitingConnection = mongoose.model('AwaitingConnection', awaitingConnection);