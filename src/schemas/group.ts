import * as mongoose from 'mongoose';
import { User } from './user';
import { Channel, channelSchema } from './channel';
import { AmityId, amityIdSchema } from './amityId';

const groupSchema = new mongoose.Schema({
    id: amityIdSchema,
    name: String,
    members: [{id: String,server: String}],
    is_verified: Boolean,
    description: String,
    owner_id: {id: String,server: String},
    is_public: Boolean,
    has_channels: Boolean,
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }]
});

export type Group = mongoose.InferSchemaType<typeof groupSchema>;
export const Group = mongoose.model('Group', groupSchema);