import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const channelSchema = new mongoose.Schema({
    id: amityIdSchema,
    type: String,
    name: String,
    pinned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    icon: String
});

export type Channel = mongoose.InferSchemaType<typeof channelSchema>;
export const Channel = mongoose.model('Channel', channelSchema);