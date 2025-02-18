import * as mongoose from 'mongoose';
import { AmityId } from './amityId';

const channelSchema = new mongoose.Schema({
    id: { type: AmityId, required: true },
    type: Number,
    name: String,
    icon_id: String
});

export type Channel = mongoose.InferSchemaType<typeof channelSchema>;
export const Channel = mongoose.model('Channel', channelSchema);