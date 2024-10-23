import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoClient } from 'mongodb';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize MongoDB connection
const uri = process.env.MONGODB_URI as string;
const db = new MongoClient(uri);

// Function to read the chat history from the MongoDB database
const readChatHistory = async () => {
  try {
    await db.connect(); // Connect to the database
    const database = db.db('calhacksdb');
    const collection = database.collection('chatHistories');

    // Fetch the most recent chat log based on timestamp
    const mostRecentChat = await collection
      .find({})
      .sort({ timestamp: -1 })  // Sort by the latest timestamp
      .limit(1)                 // Limit the result to 1 document
      .toArray();

    // Check if any chat history exists
    if (mostRecentChat.length === 0) {
      return null;  // Return null when no history is found
    }

    // Extract chat history
    const chatHistory = mostRecentChat[0].chatHistory;
    
    // Filter messages for generating the summary and insights
    const conversationLog = chatHistory
      .filter((item: any) => item.type === "assistant_message" || item.type === "user_message")
      .map((item: any) => `${item.type}: ${item.message.content}`);

    return conversationLog.join("\n");  // Return the chat log as a string
  } catch (error) {
    console.error('Error reading chat history:', error);
    throw new Error('Failed to read chat history.');
  } finally {
    await db.close();
  }
};

// API handler to fetch chat history, generate a summary, and generate insights using Gemini API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const textData = await readChatHistory();

    if (!textData) {
      return res.status(200).json({
        summary: "No conversation data available. Please provide recent conversation history for analysis.",
        insights: "Unable to generate insights without prior conversation history."
      });
    }
    
    // Create a prompt for user summary generation
    const summaryPrompt = `
      Please provide a concise summary of this conversation for the user. Highlight the main points they communicated, focusing on their emotions, concerns, or goals. Here's the conversation data: ${textData}.
    `;
    
    // Create a prompt for generating actionable insights
    const insightsPrompt = `
      Based on the conversation data, identify up to three actionable insights for the user. Focus on areas where the user can improve their emotional well-being or productivity. Provide clear, practical steps. Here's the conversation data: ${textData}.
    `;

    // Use Promise.all to generate summary and insights in parallel
    const [summaryResult, insightsResult] = await Promise.all([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: summaryPrompt }] }],
      }),
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: insightsPrompt }] }],
      }),
    ]);

    // Extract the generated text
    const summaryText = summaryResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary could not be generated';
    const insightsText = insightsResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Insights could not be generated';

    // Send formatted summary and insights
    res.status(200).json({ 
      summary: summaryText, 
      insights: insightsText 
    });
  } catch (error) {
    console.error('Error generating content or insights:', error);
    res.status(500).json({ error: 'Failed to generate content. Please try again later.' });
  }
}
