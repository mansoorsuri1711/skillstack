import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/** True only for canonical 24-char hex Mongo ObjectIds. */
export function isMongoObjectId(id: string): boolean {
  return (
    typeof id === "string" &&
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === id
  );
}

type UserSelect = string;

/**
 * Resolve a DB user from a session/auth id.
 * Handles stale JWTs that stored a Google `sub` instead of Mongo `_id`.
 */
export async function resolveUser(
  id: string,
  email?: string | null,
  select?: UserSelect,
) {
  await connectDB();

  if (isMongoObjectId(id)) {
    const byId = select
      ? await User.findById(id).select(select)
      : await User.findById(id);
    if (byId) return byId;
  }

  const byGoogle = select
    ? await User.findOne({ googleId: id }).select(select)
    : await User.findOne({ googleId: id });
  if (byGoogle) return byGoogle;

  if (email) {
    const byEmail = select
      ? await User.findOne({
          email: email.toLowerCase().trim(),
        }).select(select)
      : await User.findOne({ email: email.toLowerCase().trim() });
    if (byEmail) return byEmail;
  }

  return null;
}
