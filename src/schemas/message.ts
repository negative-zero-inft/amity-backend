import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const messageSchema = new mongoose.Schema({
    id: amityIdSchema,
    author_id: {id: String,server: String},
    type: String,
    date: Date,
    encrypted: Boolean,
    content: String, //for groups, etc. where the message isn't encrypted
    contents: [{ //if the message is encrypted, then this shouldn't be empty
        for: {id: String,server: String},
        content: String
    }]
});

export type Message = mongoose.InferSchemaType<typeof messageSchema>;
export const Message = mongoose.model('Message', messageSchema);