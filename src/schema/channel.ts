import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const channelSchema = new mongoose.Schema({
    id: amityIdSchema,
    type: Number,
    name: String,
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    icon_id: String
});

export type Channel = mongoose.InferSchemaType<typeof channelSchema>;
export const Channel = mongoose.model('Channel', channelSchema);