import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';
import { messageSchema } from './message';

export const messageClusterSchema = new mongoose.Schema({
    author: {type: amityIdSchema, unique: false},
    date: Date,
    messages: [messageSchema]
});

export type MessageCluster = mongoose.InferSchemaType<typeof messageSchema>;
export const MessageCluster = mongoose.model('Message', messageSchema);