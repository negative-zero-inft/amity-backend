import * as mongoose from 'mongoose';
import {Channel} from './channel'
import { amityIdSchema } from './amityId';

const userSchema = new mongoose.Schema({
    id: amityIdSchema,
    tag: String,
    name: String,
    description: String,
    avatar: String,
    banner: String,
    public_channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
    followers: [String],
    follows: [String],
    public_key: String,
    connections: [{
        name: String,
        secret: String
    }],
    chats: [{
        type: String,
        amity_id: amityIdSchema
    }],
    chat_folders: [{
        icon: String,
        name: String,
        elements: [{
            type: String,
            amity_id: amityIdSchema
        }]
    }],
    password: String
});

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);