import * as mongoose from 'mongoose';

export const amityIdSchema = new mongoose.Schema({
    id: {type: String, required:true, unique: true},
    server: {type: String, required: true}
});

export type AmityId = mongoose.InferSchemaType<typeof amityIdSchema>;
export const AmityId = mongoose.model('AmityId', amityIdSchema);