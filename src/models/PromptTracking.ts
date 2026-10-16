import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CitationSchema = new Schema(
  {
    title: { type: String, default: "" },
    url: { type: String, required: true },
  },
  { _id: false },
);

const EngineSnapshotSchema = new Schema(
  {
    engine: { type: String, required: true },
    brandMentioned: { type: Boolean, default: false },
    ownedCited: { type: Boolean, default: false },
    answerPreview: { type: String, default: "" },
    sources: { type: [CitationSchema], default: [] },
    checkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TrackedPromptSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true },
    topic: { type: String, default: "General", trim: true },
    branded: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    engines: { type: [EngineSnapshotSchema], default: [] },
  },
  { _id: true },
);

const VisibilityPointSchema = new Schema(
  {
    date: { type: Date, required: true },
    brandMentionRate: { type: Number, default: 0 },
    ownedCitationRate: { type: Number, default: 0 },
  },
  { _id: false },
);

const PromptTrackingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, default: "Default", trim: true },
    schedule: {
      type: String,
      enum: ["weekly", "paused"],
      default: "paused",
    },
    nextRunAt: { type: Date, default: null },
    lastRunAt: { type: Date, default: null },
    scrapedEngines: {
      type: [String],
      default: ["chatgpt"],
    },
    apiEngines: {
      type: [String],
      default: [],
    },
    locationCode: { type: Number, default: 2840 },
    languageCode: { type: String, default: "en" },
    prompts: { type: [TrackedPromptSchema], default: [] },
    history: { type: [VisibilityPointSchema], default: [] },
  },
  { timestamps: true },
);

PromptTrackingSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export type PromptTrackingDocument = InferSchemaType<
  typeof PromptTrackingSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const PromptTracking: Model<PromptTrackingDocument> =
  mongoose.models.PromptTracking ??
  mongoose.model<PromptTrackingDocument>(
    "PromptTracking",
    PromptTrackingSchema,
  );
