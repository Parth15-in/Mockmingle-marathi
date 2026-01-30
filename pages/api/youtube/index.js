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
                  { title: "PCB Manufacturing Process - Complete Guide", url: "https://www.youtube.com/watch?v=ljOoGyCso8s" },
                  { title: "How to Solder - Beginner's Guide", url: "https://www.youtube.com/watch?v=Qps9woUGkvI" },
                  { title: "PCB Design Tutorial for Beginners", url: "https://www.youtube.com/watch?v=35YuILUlfGs" },
                  { title: "Surface Mount Soldering Techniques", url: "https://www.youtube.com/watch?v=5uiroWBkdFY" },
                  { title: "PCB बनवण्याची प्रक्रिया - मराठी (Marathi)", url: "https://www.youtube.com/watch?v=VxMV6wGS3NY" },
                  { title: "इलेक्ट्रॉनिक्स मूलभूत गोष्टी - मराठी", url: "https://www.youtube.com/watch?v=6Maq5IyHSuc" }
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
                  { title: "How It's Made - Car Assembly", url: "https://www.youtube.com/watch?v=iMtXqTmfta0" },
                  { title: "Tesla Factory Tour with Elon Musk", url: "https://www.youtube.com/watch?v=Mr9e5M6LbXY" },
                  { title: "How BMW Cars Are Made - Production Line", url: "https://www.youtube.com/watch?v=Z1c2EFkm6L8" },
                  { title: "Workplace Safety Training Video", url: "https://www.youtube.com/watch?v=3IHOc5ahg9k" },
                  { title: "Manufacturing Process - Assembly Line", url: "https://www.youtube.com/watch?v=8_lfxPI5ObM" },
                  { title: "कार कशी बनवली जाते - मराठी", url: "https://www.youtube.com/watch?v=nLxWnWdKfZY" }
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
                  { title: "English Speaking Practice - Daily Conversation", url: "https://www.youtube.com/watch?v=AMLv7fIeHJM" },
                  { title: "Job Interview English - Common Questions", url: "https://www.youtube.com/watch?v=naIkpQ_cIt0" },
                  { title: "English Communication Skills", url: "https://www.youtube.com/watch?v=cXx4bMTwfBQ" },
                  { title: "इंग्रजी बोलणे शिका - मराठी मध्ये", url: "https://www.youtube.com/watch?v=8irSFvoyQHw" },
                  { title: "मुलाखतीसाठी इंग्रजी - मराठी", url: "https://www.youtube.com/watch?v=5ZRYGsVD3Ks" }
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
                  { title: "Basic Mathematics - Complete Course", url: "https://www.youtube.com/watch?v=LwCRRUa8yTU" },
                  { title: "Mathematics for Competitive Exams", url: "https://www.youtube.com/watch?v=ilClXMJczVk" },
                  { title: "गणित मूलभूत संकल्पना - मराठी", url: "https://www.youtube.com/watch?v=YQHsXMglC9A" },
                  { title: "गणित ट्रिक्स मराठी मध्ये", url: "https://www.youtube.com/watch?v=rKKur5C0ZHg" },
                  { title: "गणित सोपे तंत्र - मराठी", url: "https://www.youtube.com/watch?v=8kX62n6yNXA" }
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
                  { title: "PCB Manufacturing Process - Complete Guide", url: "https://www.youtube.com/watch?v=ljOoGyCso8s" },
                  { title: "How to Solder - Beginner's Guide", url: "https://www.youtube.com/watch?v=Qps9woUGkvI" },
                  { title: "PCB बनवण्याची प्रक्रिया - मराठी", url: "https://www.youtube.com/watch?v=VxMV6wGS3NY" }
                ]
              },
              {
                skill: "Industrial Operations (AAO & Safety)",
                videos: [
                  { title: "How It's Made - Car Assembly", url: "https://www.youtube.com/watch?v=iMtXqTmfta0" },
                  { title: "Tesla Factory Tour with Elon Musk", url: "https://www.youtube.com/watch?v=Mr9e5M6LbXY" },
                  { title: "Manufacturing Process - Assembly Line", url: "https://www.youtube.com/watch?v=8_lfxPI5ObM" }
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
