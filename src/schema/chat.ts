import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const chatSchema = new mongoose.Schema({
    id: amityIdSchema,
    members: [amityIdSchema],
    pinned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
});

export type Chat = mongoose.InferSchemaType<typeof chatSchema>;
export const Chat = mongoose.model('Chat', chatSchema);