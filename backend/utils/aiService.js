// const axios = require('axios');

// /**
//  * AI Service for ApiFreeLLM Integration
//  * Handles communication with the free LLM API
//  */

// class AIService {
//   constructor() {
//     this.apiUrl = 'https://apifreellm.com/api/chat'; // working free API
//   }

//   async chat(messages) {
//   try {
//     if (!Array.isArray(messages) || messages.length === 0) {
//       throw new Error('No messages provided to AI');
//     }

//     const last = messages[messages.length - 1];

//     if (!last || !last.content || !last.content.trim()) {
//       throw new Error('Empty message sent to AI');
//     }

//     const res = await axios.post(
//       this.apiUrl,
//       { message: last.content },
//       { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
//     );

//     return {
//       success: true,
//       message: res.data.response,
//       metadata: {
//         model: 'ApiFreeLLM',
//         responseTime: 0,
//         tokensUsed: 0
//       }
//     };
//   } catch (error) {
//     console.error('❌ AI Service Error:', error.message);
//     return {
//       success: false,
//       message: 'AI service temporarily unavailable.',
//       error: error.message
//     };
//   }
// }


//   formatMessages(contextMessages, newMessage) {
//     // Keep formatting for chat context if needed
//     const messages = [];

//     if (contextMessages && contextMessages.length > 0) {
//       contextMessages.forEach(msg => {
//         messages.push({
//           role: msg.role === 'user' ? 'user' : 'assistant',
//           content: msg.content
//         });
//       });
//     }

//     messages.push({ role: 'user', content: newMessage });
//     return messages;
//   }

//   generateSuggestedActions(aiResponse) {
//     // Keep existing logic
//     return [];
//   }
// }

// // Export singleton instance
// module.exports = new AIService();

const axios = require("axios");
require("dotenv").config();

/**
 * AI Service for OpenRouter Integration
 * Handles communication with OpenRouter LLM API
 */

class AIService {
  constructor() {
    this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.apiKey = process.env.OPENROUTER_API_KEY;

    if (!this.apiKey) {
      console.warn("⚠️ OPENROUTER_API_KEY is missing in environment variables");
    }
  }

  async chat(messages) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("No messages provided to AI");
      }

      const last = messages[messages.length - 1];
      if (!last?.content?.trim()) {
        throw new Error("Empty message sent to AI");
      }

      const startTime = Date.now();

      const res = await axios.post(
        this.apiUrl,
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages,
          max_tokens: 300
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      const aiMessage = res.data?.choices?.[0]?.message?.content;

      if (!aiMessage) {
        throw new Error("Invalid AI response format");
      }

      return {
        success: true,
        message: aiMessage,
        metadata: {
          model: res.data.model || "openrouter",
          responseTime: Date.now() - startTime,
          tokensUsed: res.data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error("❌ OpenRouter AI Error:", error.response?.data || error.message);

      return {
        success: false,
        message: "AI service temporarily unavailable.",
        error: error.message
      };
    }
  }

  formatMessages(contextMessages, newMessage) {
    const messages = [];

    if (Array.isArray(contextMessages)) {
      contextMessages.forEach(msg => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        });
      });
    }

    messages.push({ role: "user", content: newMessage });
    return messages;
  }

  generateSuggestedActions(aiResponse) {
    // Keep existing logic
    return [];
  }
}

// Export singleton instance
module.exports = new AIService();
