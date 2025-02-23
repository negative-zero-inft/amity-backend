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
    followers: [String],
    follows: [String],
    public_key: String,
    connections: [{
        name: String,
        secret: String
    }],
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    chat_folders: [chatFolderSchema],
    password: String,
    cdn: String
});

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);