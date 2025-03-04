import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';
import { chatFolderSchema } from './chatFolder';

const userSchema = new mongoose.Schema({
    id: amityIdSchema,
    tag: {type: String, unique: true},
    name: String,
    description: String,
    avatar: String,
    banner: String,
    public_channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
    followers: [amityIdSchema],
    follows: [amityIdSchema],
    public_key: String,
    authNumber: {type: Number, unique: true},
    connections: [{
        name: String,
        secret: String
    }],
    chats: [{
        chat_type: String, //group / chat / anything else
        id: amityIdSchema
    }],
    chat_folders: [chatFolderSchema],
    password: String,
    cdn: String,
    settings: Object
});

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);