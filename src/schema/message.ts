import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const messageSchema = new mongoose.Schema({
    id: amityIdSchema,
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encrypted: Boolean,
    content: String, //for groups, etc. where the message isn't encrypted
    contents: [{ //if the message is encrypted, then this shouldn't be empty
        for: amityIdSchema, //whatever really, could also be a user ref
        content: String
    }]
});

export type Message = mongoose.InferSchemaType<typeof messageSchema>;
export const Message = mongoose.model('Message', messageSchema);