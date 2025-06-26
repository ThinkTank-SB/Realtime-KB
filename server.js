
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const OPENAI_API_KEY = ''; // Add your API key

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Store latency measurements per session
const latencyData = new Map();

// Mock document/knowledge base
const KNOWLEDGE_BASE = {
  "company_policy": {
    title: "Company Policy Document",
    content: "Our company follows strict guidelines for remote work. Employees must be available during core hours 10 AM to 3 PM. All meetings should be scheduled in advance.",
    category: "HR"
  },
  "product_specs": {
    title: "Product Specifications",
    content: "Our main product supports 1000+ concurrent users, has 99.9% uptime, and includes real-time analytics dashboard with custom reporting features.",
    category: "Technical"
  },
  "pricing_info": {
    title: "Pricing Information",
    content: "Basic plan: $29/month, Pro plan: $99/month, Enterprise: Custom pricing. All plans include 24/7 support and free onboarding.",
    category: "Sales"
  },
  "employee_benefits": {
    title: "Employee Benefits Package",
    content: "Comprehensive health insurance including medical, dental, and vision coverage. Additional benefits include 401k matching, flexible PTO, and professional development budget of $2000 annually.",
    category: "HR"
  },
  "it_support": {
    title: "IT Support Procedures",
    content: "For technical issues, contact IT support via helpdesk portal or email support@company.com. Response time: Critical issues within 2 hours, standard issues within 24 hours.",
    category: "Technical"
  },
  "onboarding_process": {
    title: "Employee Onboarding Process",
    content: "New hires complete orientation and training in the first week. Includes IT setup, HR documentation, department introductions, and mentor assignment.",
    category: "HR"
  },
  "data_privacy": {
    title: "Data Privacy and Security Policy",
    content: "All customer data is encrypted at rest and in transit. We comply with GDPR, CCPA, and SOC 2 Type II standards. Regular security audits are conducted quarterly.",
    category: "Legal"
  },
  "customer_service": {
    title: "Customer Service Guidelines",
    content: "Always respond to customer inquiries within 24 hours. Escalate complex issues to senior support. Maintain professional tone and provide detailed solutions.",
    category: "Customer Service"
  },
  "sales_commission": {
    title: "Sales Commission Structure",
    content: "Sales representatives earn 10% commission on all new sales, 5% on renewals. Quarterly bonuses available for exceeding targets. Commission paid monthly.",
    category: "Sales"
  },
  "expense_policy": {
    title: "Expense Reimbursement Policy",
    content: "Submit receipts within 30 days for reimbursement. Approved expenses include travel, meals (up to $50/day), and business supplies. Use expense management system for submissions.",
    category: "Finance"
  },
  "product_warranty": {
    title: "Product Warranty Information",
    content: "All products come with a comprehensive one-year warranty covering defects and performance issues. Extended warranty options available for enterprise customers.",
    category: "Technical"
  },
  "travel_policy": {
    title: "Business Travel Policy",
    content: "Employees must get pre-approval for business travel exceeding $500. Book through approved travel agency. Economy class for domestic, business class for international flights over 6 hours.",
    category: "Finance"
  },
  "performance_review": {
    title: "Performance Review Process",
    content: "Annual performance reviews conducted in Q4. Includes goal setting, 360-degree feedback, and development planning. Mid-year check-ins scheduled in Q2.",
    category: "HR"
  },
  "it_security": {
    title: "IT Security Requirements",
    content: "All employees must use multi-factor authentication for system access. VPN required for remote work. Password policy: minimum 12 characters with complexity requirements.",
    category: "Technical"
  },
  "holiday_schedule": {
    title: "Company Holiday Schedule",
    content: "Company observes all federal holidays plus additional floating holidays. Total of 12 paid holidays annually. Holiday calendar published at beginning of each year.",
    category: "HR"
  },
  "code_of_conduct": {
    title: "Employee Code of Conduct",
    content: "Maintain professionalism and respect in all interactions. Zero tolerance for harassment or discrimination. Report violations to HR immediately. Annual ethics training required.",
    category: "HR"
  },
  "api_documentation": {
    title: "API Integration Guide",
    content: "RESTful API with OAuth 2.0 authentication. Rate limits: 1000 requests per hour. Comprehensive documentation available at docs.company.com with code examples.",
    category: "Technical"
  },
  "marketing_guidelines": {
    title: "Brand and Marketing Guidelines",
    content: "Focus on digital channels and social media engagement. Brand colors: Primary blue #0066CC, Secondary gray #666666. All marketing materials require brand team approval.",
    category: "Marketing"
  },
  "customer_feedback": {
    title: "Customer Feedback Process",
    content: "Collect and analyze customer feedback monthly through surveys and support interactions. NPS target: 50+. Feedback reviewed in monthly customer success meetings.",
    category: "Customer Service"
  },
  "workplace_safety": {
    title: "Workplace Safety Guidelines",
    content: "Follow OSHA guidelines to maintain a safe work environment. Emergency procedures posted in all areas. Monthly safety training required. Report incidents immediately to facilities team.",
    category: "Safety"
  }
};


// Function to search knowledge base
function searchKnowledgeBase(query) {
  const searchTerm = query.toLowerCase();
  const results = [];
  
  for (const [key, doc] of Object.entries(KNOWLEDGE_BASE)) {
    if (doc.title.toLowerCase().includes(searchTerm) || 
        doc.content.toLowerCase().includes(searchTerm) ||
        doc.category.toLowerCase().includes(searchTerm)) {
      results.push({
        id: key,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        relevance: "high"
      });
    }
  }
  
  return results.length > 0 ? results : [{
    message: `No documents found for "${query}". Available topics: company policy, product specs, pricing info`
  }];
}

// Session endpoint with document lookup function
app.get('/session', async (req, res) => {
  try {
    const sessionStartTime = Date.now();
    
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "alloy",
        turn_detection: {
          type: "server_vad",
          threshold: 0.3,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        },
        modalities: ["audio", "text"],
        instructions: "You are a helpful assistant with access to company documents. When users ask about company information, policies, products, or pricing, use the search_documents function to find relevant information. Keep responses concise for better latency. RESPOND IN ENGLISH ONLY, OVERRIDE EVERY OTHER LANGUAGE, THIS IS A STRICT PROMPT!",
        // Document lookup function
        tools: [{
          type: "function",
          name: "search_documents",
          description: "Search through company documents and knowledge base for relevant information",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to find relevant documents (e.g., 'company policy', 'pricing', 'product features')"
              }
            },
            required: ["query"]
          }
        }]
      })
    });
    
    const sessionEndTime = Date.now();
    const sessionCreationLatency = sessionEndTime - sessionStartTime;
    
    const data = await response.json();
    console.log(`📊 Session creation latency: ${sessionCreationLatency}ms`);

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    if (data.client_secret && data.client_secret.value) {
      // Initialize latency tracking for this session
      const sessionId = data.client_secret.value.substring(0, 8);
      latencyData.set(sessionId, {
        sessionCreationLatency,
        interactions: [],
        averageResponseTime: 0,
        totalInteractions: 0
      });
      
      res.json({ 
        ephemeral_key: data.client_secret.value,
        session_id: sessionId,
        session_creation_latency: sessionCreationLatency
      });
    } else {
      res.status(500).json({ error: "No ephemeral key in response" });
    }
  } catch (err) {
    console.error("Session creation error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Function calling endpoint for document lookup with latency tracking
app.post('/function-call', async (req, res) => {
  try {
    const functionStartTime = Date.now();
    const { name, arguments: functionArgs, call_id, session_id } = req.body;
    
    console.log(`📚 Function called: ${name} with args:`, functionArgs);
    
    let result = {};
    
    if (name === 'search_documents') {
      const args = JSON.parse(functionArgs);
      result = {
        query: args.query,
        documents: searchKnowledgeBase(args.query),
        search_performed: true,
        timestamp: new Date().toISOString()
      };
      console.log(`📄 Document search result:`, result);
    } else {
      result = { error: `Unknown function: ${name}` };
    }
    
    const functionEndTime = Date.now();
    const functionLatency = functionEndTime - functionStartTime;
    
    // Track function call latency
    if (session_id && latencyData.has(session_id)) {
      const sessionData = latencyData.get(session_id);
      sessionData.interactions.push({
        type: 'function_call',
        function_name: name,
        latency: functionLatency,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`⚡ Function execution latency: ${functionLatency}ms`);
    
    res.json({
      call_id: call_id,
      output: JSON.stringify(result),
      function_latency: functionLatency
    });
    
  } catch (err) {
    console.error("Function call error:", err);
    res.status(500).json({ error: "Function call failed" });
  }
});

// New endpoint to track speech interaction latencies
app.post('/track-latency', async (req, res) => {
  try {
    const { 
      session_id, 
      event_type, 
      timestamp, 
      speech_start_time, 
      speech_end_time, 
      response_start_time, 
      response_end_time,
      first_audio_chunk_time 
    } = req.body;
    
    if (!latencyData.has(session_id)) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    const sessionData = latencyData.get(session_id);
    
    // Calculate various latency metrics
    let latencyMetrics = {};
    
    if (speech_start_time && speech_end_time && response_start_time) {
      const speechDuration = speech_end_time - speech_start_time;
      const processingLatency = response_start_time - speech_end_time;
      
      latencyMetrics = {
        speech_duration: speechDuration,
        processing_latency: processingLatency,
        timestamp: new Date().toISOString()
      };
      
      if (first_audio_chunk_time) {
        latencyMetrics.time_to_first_audio = first_audio_chunk_time - speech_end_time;
      }
      
      if (response_end_time) {
        latencyMetrics.total_response_time = response_end_time - speech_end_time;
      }
    }
    
    sessionData.interactions.push({
      type: event_type,
      ...latencyMetrics
    });
    
    sessionData.totalInteractions++;
    
    // Calculate running average of processing latency
    if (latencyMetrics.processing_latency) {
      const totalProcessingTime = sessionData.interactions
        .filter(i => i.processing_latency)
        .reduce((sum, i) => sum + i.processing_latency, 0);
      const processingInteractions = sessionData.interactions
        .filter(i => i.processing_latency).length;
      
      sessionData.averageResponseTime = totalProcessingTime / processingInteractions;
      
      console.log(`📊 Latency Metrics for Session ${session_id}:`);
      console.log(`   Speech Duration: ${latencyMetrics.speech_duration}ms`);
      console.log(`   Processing Latency: ${latencyMetrics.processing_latency}ms`);
      if (latencyMetrics.time_to_first_audio) {
        console.log(`   Time to First Audio: ${latencyMetrics.time_to_first_audio}ms`);
      }
      console.log(`   Average Response Time: ${Math.round(sessionData.averageResponseTime)}ms`);
    }
    
    res.json({ 
      success: true, 
      latency_metrics: latencyMetrics,
      session_stats: {
        total_interactions: sessionData.totalInteractions,
        average_response_time: Math.round(sessionData.averageResponseTime)
      }
    });
    
  } catch (err) {
    console.error("Latency tracking error:", err);
    res.status(500).json({ error: "Failed to track latency" });
  }
});

// Get latency statistics for a session
app.get('/latency-stats/:session_id', (req, res) => {
  const { session_id } = req.params;
  
  if (!latencyData.has(session_id)) {
    return res.status(404).json({ error: "Session not found" });
  }
  
  const sessionData = latencyData.get(session_id);
  
  // Calculate detailed statistics
  const processingLatencies = sessionData.interactions
    .filter(i => i.processing_latency)
    .map(i => i.processing_latency);
  
  const functionLatencies = sessionData.interactions
    .filter(i => i.type === 'function_call')
    .map(i => i.latency);
  
  const stats = {
    session_creation_latency: sessionData.sessionCreationLatency,
    total_interactions: sessionData.totalInteractions,
    average_response_time: Math.round(sessionData.averageResponseTime),
    processing_latencies: {
      count: processingLatencies.length,
      min: processingLatencies.length > 0 ? Math.min(...processingLatencies) : 0,
      max: processingLatencies.length > 0 ? Math.max(...processingLatencies) : 0,
      average: processingLatencies.length > 0 ? 
        Math.round(processingLatencies.reduce((a, b) => a + b, 0) / processingLatencies.length) : 0
    },
    function_call_latencies: {
      count: functionLatencies.length,
      min: functionLatencies.length > 0 ? Math.min(...functionLatencies) : 0,
      max: functionLatencies.length > 0 ? Math.max(...functionLatencies) : 0,
      average: functionLatencies.length > 0 ? 
        Math.round(functionLatencies.reduce((a, b) => a + b, 0) / functionLatencies.length) : 0
    },
    recent_interactions: sessionData.interactions.slice(-5) // Last 5 interactions
  };
  
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`🚀 Server with document lookup and latency tracking running at http://localhost:${PORT}`);
  console.log(`📊 Latency tracking endpoints:`);
  console.log(`   POST /track-latency - Track speech interaction latencies`);
  console.log(`   GET /latency-stats/:session_id - Get session latency statistics`);
});
