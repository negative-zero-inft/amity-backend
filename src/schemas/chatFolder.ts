import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const chatFolderSchema = new mongoose.Schema({
    icon: String,
    name: String,
    elements: [{
        chat_type: String,
        id: {type: amityIdSchema, unique: false}
    }]
});

export type ChatFolder = mongoose.InferSchemaType<typeof chatFolderSchema>;
export const ChatFolder = mongoose.model('ChatFolder', chatFolderSchema);