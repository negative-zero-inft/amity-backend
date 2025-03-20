import * as mongoose from 'mongoose';
import { amityIdSchema } from './amityId';

export const messageClusterSchema = new mongoose.Schema({
    author: {id: String,server: String},
    date: Date,
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
});

export type MessageCluster = mongoose.InferSchemaType<typeof messageClusterSchema>;
export const MessageCluster = mongoose.model('MessageCluster', messageClusterSchema);