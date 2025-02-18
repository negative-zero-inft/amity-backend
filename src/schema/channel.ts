import * as mongoose from 'mongoose';
import { AmityId, amityIdSchema } from './amityId';

const channelSchema = new mongoose.Schema({
    id: amityIdSchema,
    type: Number,
    name: String,
    icon_id: String
});

export type Channel = mongoose.InferSchemaType<typeof channelSchema>;
export const Channel = mongoose.model('Channel', channelSchema);