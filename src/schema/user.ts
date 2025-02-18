import * as mongoose from 'mongoose';
import {Channel} from './channel'
import { AmityId } from './amityId';

const userSchema = new mongoose.Schema({
    id: {type: AmityId, required: true},
    server: String,
    tag: String,
    name: String,
    description: String,
    avatar: String,
    banner: String,
    public_channels: [Channel],
    followers: [String],
    follows: [String],
    public_key: String,
    connections: [{
        name: String,
        secret: String
    }],
    email: String,
    password: String
});

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);