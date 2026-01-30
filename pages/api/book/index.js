import connectDB from "../../../middleware/dbConnect";
import Book from "../../../models/Book";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const userEmail = req.headers['user-email'];
      const query = userEmail ? { userEmail } : {};
      const recommendations = await Book.find(query);
      return res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, userEmail, recommendations } = req.body;
      if (!recommendations || !Array.isArray(recommendations)) {
        return res.status(400).json({ success: false, error: 'Recommendations array is required' });
      }
      const newEntry = await Book.create({ userId, userEmail, recommendations });
      return res.status(201).json({ success: true, data: newEntry });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to save recommendations' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
