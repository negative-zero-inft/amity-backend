import * as mongoose from 'mongoose';
import { User } from './user';
import { Channel } from './channel';
import { AmityId } from './amityId';

const groupSchema = new mongoose.Schema({
    id: { type: AmityId, required: true },
    name: String,
    members: [User],
    is_verified: Boolean,
    description: String,
    owner_id: String,
    is_public: Boolean,
    has_channels: Boolean,
    channels: [Channel]
});

export type Group = mongoose.InferSchemaType<typeof groupSchema>;
export const Group = mongoose.model('Group', groupSchema);