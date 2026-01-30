import connectDB from "../../../middleware/dbConnect";
import Youtube from "../../../models/Youtube";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const userEmail = req.headers['user-email'];
      const { subject } = req.query;
      console.log("Fetching for:", { userEmail, subject });

      let query = {};

      if (subject && subject.toLowerCase() !== 'student') {
        query = { "recommendations.skill": { $regex: new RegExp(subject, 'i') } };
      } else if (userEmail) {
        query = { userEmail };
      }

      const recommendations = await Youtube.find(query);
      console.log("Recommendations found in DB:", recommendations.length);

      if (recommendations.length === 0 || (subject && subject.toLowerCase() === 'student')) {
        const sub = subject ? subject.toLowerCase() : '';

        if (sub.includes('pcb')) {
          return res.status(200).json({
            success: true,
            data: [{
              createdAt: new Date(),
              recommendations: [{
                skill: "PCB (Printed Circuit Board) Design & Assembly",
                videos: [
                  { title: "Electronic Component Soldering Basics", url: "https://www.youtube.com/watch?v=f95i88OSWB4" },
                  { title: "How a PCB is Manufactured", url: "https://www.youtube.com/watch?v=yvTid2j7oY4" },
                  { title: "Basics of PCB Design for Beginners", url: "https://www.youtube.com/watch?v=3Sia7A_f_H8" },
                  { title: "Surface Mount Technology (SMT) Overview", url: "https://www.youtube.com/watch?v=3C9_6A_v4fU" },
                  { title: "Hand Soldering Techniques for PCBs", url: "https://www.youtube.com/watch?v=vIT4ra6Mo0s" }
                ]
              }]
            }]
          });
        }

        if (sub.includes('aao') || sub.includes('automotive') || sub.includes('assembly') || sub.includes('operator')) {
          return res.status(200).json({
            success: true,
            data: [{
              createdAt: new Date(),
              recommendations: [{
                skill: "AAO (Automotive Assembly Operator) Process & Safety",
                videos: [
                  { title: "Modern Car Assembly Line Tour", url: "https://www.youtube.com/watch?v=2n6_9O-K1S8" },
                  { title: "How a Car is Made: Factory Tour", url: "https://www.youtube.com/watch?v=8_lS-9257-U" },
                  { title: "Workplace Safety in Automotive Plants", url: "https://www.youtube.com/watch?v=Xh0mC_y9m_o" },
                  { title: "Assembly Line Skills & Techniques", url: "https://www.youtube.com/watch?v=pAnR9_wW3fI" },
                  { title: "Industrial Safety Training Overview", url: "https://www.youtube.com/watch?v=m2G-rJp8k5A" }
                ]
              }]
            }]
          });
        }

        if (sub.includes('english') || sub.includes('communication')) {
          return res.status(200).json({
            success: true,
            data: [{
              createdAt: new Date(),
              recommendations: [{
                skill: "English Communication",
                videos: [
                  { title: "English Conversation Practice", url: "https://www.youtube.com/watch?v=kY6T-K1X4oM" },
                  { title: "Professional English for Interviews", url: "https://www.youtube.com/watch?v=X0V7mZ17hK0" }
                ]
              }]
            }]
          });
        }

        if (sub.includes('math') || sub.includes('ganit')) {
          return res.status(200).json({
            success: true,
            data: [{
              createdAt: new Date(),
              recommendations: [{
                skill: "Mathematics Foundations",
                videos: [
                  { title: "Basic Maths Concepts in Marathi", url: "https://www.youtube.com/watch?v=3Sia7A_f_H8" },
                  { title: "Ganit Maithili Skills", url: "https://www.youtube.com/watch?v=0kFp6c9m-xU" }
                ]
              }]
            }]
          });
        }

        return res.status(200).json({
          success: true,
          data: [{
            createdAt: new Date(),
            recommendations: [
              {
                skill: "Core Technical Skills (PCB & Assembly)",
                videos: [
                  { title: "How PCBs are Made - Step by Step", url: "https://www.youtube.com/watch?v=T_7bY7F0lXo" },
                  { title: "Electronic Component Soldering Basics", url: "https://www.youtube.com/watch?v=f95i88OSWB4" }
                ]
              },
              {
                skill: "Industrial Operations (AAO & Safety)",
                videos: [
                  { title: "Modern Car Assembly Line Tour", url: "https://www.youtube.com/watch?v=2n6_9O-K1S8" },
                  { title: "Automotive Manufacturing Overview", url: "https://www.youtube.com/watch?v=pAnR9_wW3fI" }
                ]
              }
            ]
          }]
        });
      }

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
      const newEntry = await Youtube.create({ userId, userEmail, recommendations });
      return res.status(201).json({ success: true, data: newEntry });
    } catch (error) {
      console.error('Error saving YouTube recommendations:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to save recommendations' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
