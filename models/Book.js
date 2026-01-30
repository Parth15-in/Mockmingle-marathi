import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // ObjectId or string
      ref: "User",
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: false,
    },
    recommendations: [
      {
        skill: { type: String },
        books: [
          {
            title: { type: String },
            url: { type: String },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model("Book", bookSchema);
