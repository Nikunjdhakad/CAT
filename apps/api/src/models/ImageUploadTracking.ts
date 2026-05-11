import mongoose, { Schema, Types } from "mongoose";

export interface IUploadRecord {
  timestamp: Date;
}

export interface IImageUploadTracking {
  userId: Types.ObjectId;
  uploads: IUploadRecord[];
  windowStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UploadRecordSchema = new Schema<IUploadRecord>(
  {
    timestamp: { type: Date, required: true, default: Date.now }
  },
  { _id: false }
);

const ImageUploadTrackingSchema = new Schema<IImageUploadTracking>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true
    },
    uploads: {
      type: [UploadRecordSchema],
      default: []
    },
    windowStart: { 
      type: Date, 
      required: true, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

// Index for user lookup
ImageUploadTrackingSchema.index({ userId: 1 });

// TTL index - documents expire 1 hour after windowStart
ImageUploadTrackingSchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 });

export const ImageUploadTracking =
  mongoose.models.ImageUploadTracking ?? 
  mongoose.model<IImageUploadTracking>("ImageUploadTracking", ImageUploadTrackingSchema);
