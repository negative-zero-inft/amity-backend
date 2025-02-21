import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const chatFolderSchema = new mongoose.Schema({
    icon: String,
    name: {type: String, unique: true},
    elements: [{
        type: String,
        amity_id: amityIdSchema
    }]
});

export type ChatFolder = mongoose.InferSchemaType<typeof chatFolderSchema>;
export const ChatFolder = mongoose.model('ChatFolder', chatFolderSchema);