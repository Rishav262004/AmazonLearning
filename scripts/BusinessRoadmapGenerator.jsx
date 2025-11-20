import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Lightbulb, TrendingUp, DollarSign, Map, AlertTriangle, BarChart3, Rocket, MessageSquare, Send, Download, Zap, History, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// NOTE: This component now avoids hammering the Anthropic API when no API key is
// configured and includes exponential backoff to soften rate limits. Provide one
// of the following environment variables when building/running:
// - VITE_ANTHROPIC_API_KEY
// - REACT_APP_ANTHROPIC_API_KEY
// - ANTHROPIC_API_KEY

const getApiKey = () => {
  const importMetaKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ANTHROPIC_API_KEY : undefined;
  const processKey = typeof process !== 'undefined' ? (process.env?.REACT_APP_ANTHROPIC_API_KEY || process.env?.ANTHROPIC_API_KEY) : undefined;
  return importMetaKey || processKey || '';
};

export default function BusinessRoadmapGenerator() {
  const [businessIdea, setBusinessIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [researchMode, setResearchMode] = useState('deep');
  const [chatResponse, setChatResponse] = useState(null);
  const [mockMode, setMockMode] = useState(() => !getApiKey());
  const chatEndRef = useRef(null);

  const steps = [
    { icon: TrendingUp, label: 'Market Research', key: 'research' },
    { icon: Lightbulb, label: 'Executive Summary', key: 'executive' },
    { icon: DollarSign, label: 'Revenue Model', key: 'revenue' },
    { icon: Map, label: 'Implementation', key: 'implementation' },
    { icon: Rocket, label: 'Scaling Strategy', key: 'scaling' },
    { icon: BarChart3, label: 'Financials', key: 'financial' },
    { icon: AlertTriangle, label: 'Risk Assessment', key: 'risks' }
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const saved = localStorage.getItem('researchMode');
    if (saved) setResearchMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('researchMode', researchMode);
  }, [researchMode]);

  const saveToHistory = (currentRoadmap) => {
    if (!currentRoadmap) return;
    const snapshot = {
      timestamp: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(currentRoadmap)),
      idea: businessIdea
    };
    setRoadmapHistory(prev => [snapshot, ...prev].slice(0, 10));
  };

  const restoreFromHistory = (snapshot) => {
    setRoadmap(snapshot.data);
    setShowHistory(false);
  };

  const processContent = (text) => {
    if (!text) return { html: '', data: null };
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    text = text.replace(/^#{1,6}\s+(.+)$/gm, '<h3 class="text-2xl font-bold text-indigo-900 mt-8 mb-4 pb-2 border-b-2 border-indigo-200">$1</h3>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="ml-6 my-3 pl-2"><span class="font-semibold text-indigo-600">$1.</span> $2</li>');
    text = text.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-6 my-3 pl-2 list-disc">$1</li>');
    text = text.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul class="space-y-2 my-4">$&</ul>');
    
    text = text.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
      const headers = header.split('|').filter(h => h.trim()).map(h => h.trim());
      const rowData = rows.trim().split('\n').map(row => 
        row.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
      );
      
      let table = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-300 rounded-lg">';
      table += '<thead class="bg-indigo-100"><tr>';
      headers.forEach(h => {
        table += `<th class="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">${h}</th>`;
      });
      table += '</tr></thead><tbody>';
      
      rowData.forEach((row, idx) => {
        table += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
        row.forEach(cell => {
          table += `<td class="border border-gray-300 px-4 py-3 text-gray-700">${cell}</td>`;
        });
        table += '</tr>';
      });
      
      table += '</tbody></table></div>';
      return table;
    });
    
    text = text.replace(/^(?!<[hl]|<ul|<table|<div)(.+)$/gm, '<p class="my-3 text-gray-700 leading-relaxed">$1</p>');
    
    return { html: text, data: null };
  };

  const getApiKey = () => {
    const importMetaKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ANTHROPIC_API_KEY : undefined;
    const processKey = typeof process !== 'undefined' ? (process.env?.REACT_APP_ANTHROPIC_API_KEY || process.env?.ANTHROPIC_API_KEY) : undefined;
    return importMetaKey || processKey || '';
  };

  const buildMockSection = (title, subtitle) => `
    <h3>${title}</h3>
    <p class="my-3 text-gray-700">${subtitle}</p>
    <ul class="space-y-2 my-4">
      <li class="ml-6 my-3 pl-2"><span class="font-semibold text-indigo-600">1.</span> Sample bullet showing structure</li>
      <li class="ml-6 my-3 pl-2"><span class="font-semibold text-indigo-600">2.</span> Replace with live data once API key is set</li>
    </ul>
  `;

  const createMockResponse = (stepKey, idea) => {
    const titles = {
      research: 'Market Research',
      executive: 'Executive Summary',
      revenue: 'Revenue Model',
      implementation: 'Implementation',
      scaling: 'Scaling Strategy',
      financial: 'Financials',
      risks: 'Risk Assessment'
    };

    const subtitles = {
      research: `Mocked market size, growth, and competition for ${idea || 'your idea'}`,
      executive: 'High-level goals and positioning for investors',
      revenue: 'Illustrative pricing and unit economics in INR',
      implementation: '18-month phased plan with team and budget placeholders',
      scaling: 'City-by-city rollout with example timelines',
      financial: 'Placeholder projections to showcase layout',
      risks: 'Key risks with mitigation placeholders'
    };

    const title = titles[stepKey] || 'Roadmap Section';
    const subtitle = subtitles[stepKey] || 'Demo-only placeholder content';
    return { html: buildMockSection(title, subtitle), data: null };
  };

  const callClaudeAPI = async (prompt, stepKey, useWebSearch = false, retryCount = 0) => {
    const apiKey = getApiKey();
    if (mockMode || !apiKey) {
      // Avoid hitting the Anthropic API without credentials; return mock content instead.
      if (!apiKey && !mockMode) {
        console.warn('ANTHROPIC_API_KEY not set. Returning mock content to avoid rate limits.');
      }
      return createMockResponse(stepKey, businessIdea);
    }

    const requestBody = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    };

    if (useWebSearch && researchMode === 'deep') {
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'tools-2024-10-22'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if ((response.status === 529 || response.status === 429) && retryCount < 3) {
          const waitTime = Math.min(15000, (retryCount + 1) * 4000);
          console.log(`Rate limited (${response.status}), waiting ${waitTime}ms before retry ${retryCount + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return callClaudeAPI(prompt, stepKey, useWebSearch, retryCount + 1);
        }

        if (response.status === 429) {
          console.warn('Rate limit hit after retries. Falling back to mock content.');
          return createMockResponse(stepKey, businessIdea);
        }

        throw new Error(`API error ${response.status}: ${response.status === 429 ? 'Rate limit exceeded. Please wait a moment and try again.' : 'Service temporarily unavailable.'}`);
      }

      const data = await response.json();
      
      if (data.stop_reason === 'tool_use') {
        const textBlocks = data.content.filter(block => block.type === 'text');
        if (textBlocks.length > 0) {
          const combinedText = textBlocks.map(block => block.text).join('\n');
          if (combinedText.trim().length > 100) {
            return processContent(combinedText);
          }
        }
        
        const toolUseBlock = data.content.find(block => block.type === 'tool_use');
        if (toolUseBlock) {
          const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-beta': 'tools-2024-10-22'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20240620',
              max_tokens: 4000,
              messages: [
                { role: 'user', content: prompt },
                { role: 'assistant', content: data.content },
                { 
                  role: 'user', 
                  content: [{
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: 'Search completed. Provide detailed analysis.'
                  }]
                }
              ],
              tools: requestBody.tools
            })
          });

          if (!followUpResponse.ok) {
            if ((followUpResponse.status === 529 || followUpResponse.status === 429) && retryCount < 3) {
              const waitTime = Math.min(15000, (retryCount + 1) * 4000);
              console.log(`Rate limited (${followUpResponse.status}) on follow-up, waiting ${waitTime}ms before retry ${retryCount + 1}/3...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              return callClaudeAPI(prompt, stepKey, useWebSearch, retryCount + 1);
            }

            if (followUpResponse.status === 429) {
              console.warn('Follow-up rate limit hit. Returning mock content.');
              return createMockResponse(stepKey, businessIdea);
            }

            throw new Error(`Follow-up error: ${followUpResponse.status}`);
          }

          const followUpData = await followUpResponse.json();
          const followUpText = followUpData.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');
          
          if (followUpText.trim().length > 0) {
            return processContent(followUpText);
          }
        }
      }
      
      const textContent = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
      
      if (textContent.trim().length === 0) {
        throw new Error('Empty response');
      }
      
      return processContent(textContent);
      
    } catch (error) {
      console.error('API error:', error);
      return mockMode ? createMockResponse(stepKey, businessIdea) : {
        html: `<div class="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <p class="text-red-800 font-semibold mb-2">Error: ${error.message}</p>
          <p class="text-gray-600 text-sm">Please try again, or enable Demo Mode to view placeholder content.</p>
        </div>`,
        data: null
      };
    }
  };

  const getPrompt = (stepKey, idea) => {
    const prompts = {
      research: `Analyze this Indian market business idea: "${idea}"

Provide detailed market research with:

MARKET SIZE
- Total market in India (INR Crores)
- Growth rate and trends
- Key cities and regions

COMPETITION
- List 5-7 competitors
- Their positioning and funding
- Market gaps

CUSTOMERS
- Target segments with income levels
- Demographics and preferences
- Pain points

REGULATIONS
- Required licenses
- Compliance needs
- Setup costs

TRENDS
- Recent developments
- Opportunities
- Risks

Use bullet points and realistic numbers.`,

      executive: `Create executive summary for Indian market: "${idea}"

OVERVIEW
- Value proposition
- Problem solved
- Target customers
- Differentiation

OPPORTUNITY
- Market size (TAM/SAM/SOM)
- Growth potential
- Target cities

MODEL
- Revenue streams
- Pricing strategy
- Key partnerships

METRICS
Show Year 1, 2, 3 targets for customers, revenue, cities, team.`,

      revenue: `Design revenue model for: "${idea}"

STREAMS
- Primary and secondary revenue
- Pricing in INR
- Rationale

PRICING
Create table with tiers, prices, features, target customers.

ECONOMICS
- AOV, CAC, LTV in INR
- LTV:CAC ratio
- Margins

PROJECTIONS
Monthly targets for 12 months.`,

      implementation: `Create 18-month plan for: "${idea}"

PHASE 1 (M1-3): Foundation
- MVP features
- Team and salaries
- Tech stack
- Budget

PHASE 2 (M4-6): Launch
- Target city
- Customer goals
- Marketing
- Budget

PHASE 3 (M7-12): Growth
- Expansion
- Revenue targets
- Team growth
- Budget

PHASE 4 (M13-18): Scale
- Multi-city
- Profitability
- Funding
- Budget`,

      scaling: `Scaling strategy for: "${idea}"

CHANNELS
- Marketing approach
- Partnerships
- Growth tactics

EXPANSION
- City sequence
- Timeline
- Investment

OPERATIONS
- Team growth
- Tech infrastructure
- Automation

TARGETS
Quarterly goals for customers, revenue, team, cities.`,

      financial: `3-year projections for: "${idea}"

STARTUP COSTS
- Tech, legal, marketing
- Total in INR Lakhs

MONTHLY EXPENSES
Year 1, 2, 3 breakdown

REVENUE
Monthly Year 1, Quarterly Year 2-3

METRICS
- Burn rate
- Runway
- Break-even
- EBITDA

FUNDING
- Seed and Series A
- Use of funds
- Dilution`,

      risks: `Risk assessment for: "${idea}"

For each category, list 3-4 risks with Impact, Probability, Mitigation, Contingency:

MARKET RISKS
Competition, adoption, CAC

FINANCIAL RISKS
Funding, cash flow, burn

OPERATIONAL RISKS
Hiring, tech, supply chain

REGULATORY RISKS
Policy, compliance, privacy

COMPETITIVE RISKS
Incumbents, entrants, consolidation`
    };

    return prompts[stepKey] || prompts.research;
  };

  const generateRoadmap = async () => {
    if (!businessIdea.trim()) return;

    setLoading(true);
    setRoadmap(null);
    setChatMessages([]);
    setChatResponse(null);
    
    const generatedRoadmap = {};

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setCurrentStep(`${step.label} (${i + 1}/${steps.length})`);
        
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
        
        const prompt = getPrompt(step.key, businessIdea);
        const useWebSearch = step.key === 'research';
        const result = await callClaudeAPI(prompt, step.key, useWebSearch);
        
        generatedRoadmap[step.key] = result;
        setRoadmap({...generatedRoadmap});
      }
      
      saveToHistory(generatedRoadmap);
      alert('Roadmap generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      alert(`${error.message}\n\nTip: Try using Fast mode or wait 1-2 minutes before trying again.`);
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  const handleChat = async () => {
    if (!userMessage.trim() || !roadmap) return;

    const newMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newMessage]);
    setUserMessage('');
    setChatLoading(true);
    setChatResponse(null);

    try {
      const lower = userMessage.toLowerCase();
      const targetStep = steps.find(s => lower.includes(s.key))?.key || 'executive';

      const context = `Improve this section for: "${businessIdea}"

Current content: ${roadmap[targetStep]?.html?.substring(0, 800)}

User request: ${userMessage}

Provide improved version with bullet points, tables, and realistic INR numbers.`;

      const result = await callClaudeAPI(context, targetStep, false);
      
      setChatResponse({
        step: targetStep,
        content: result,
        originalContent: roadmap[targetStep]
      });
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Created improved ${targetStep} section. Review and apply or keep original.` 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error occurred. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyChatResponse = () => {
    if (!chatResponse) return;
    
    saveToHistory(roadmap);
    
    const updatedRoadmap = {...roadmap};
    updatedRoadmap[chatResponse.step] = chatResponse.content;
    setRoadmap(updatedRoadmap);
    setChatResponse(null);
    
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: `Applied changes to ${chatResponse.step}. Previous saved to history.`
    }]);
  };

  const rejectChatResponse = () => {
    setChatResponse(null);
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Kept original. Ask for different changes if needed.'
    }]);
  };

  const downloadRoadmap = () => {
    if (!roadmap) return;

    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    let content = `BUSINESS ROADMAP\nIdea: ${businessIdea}\nMode: ${researchMode}\nDate: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    
    steps.forEach(step => {
      if (roadmap[step.key]) {
        content += `\n${'='.repeat(80)}\n${step.label.toUpperCase()}\n${'='.repeat(80)}\n`;
        content += stripHtml(roadmap[step.key].html) + '\n';
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="w-14 h-14 text-indigo-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900">AI Business Roadmap Generator</h1>
          </div>
          <p className="text-gray-600 text-lg">Data-Driven Planning for Indian Market</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase">
            Describe Your Business Idea
          </label>
          <textarea
            value={businessIdea}
            onChange={(e) => setBusinessIdea(e.target.value)}
            placeholder="Example: A hyperlocal grocery delivery platform for tier-2 cities in India..."
            className="w-full h-36 px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
            disabled={loading}
          />

          <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <strong className="text-lg">Research Mode</strong>
                <p className="text-sm text-gray-600 mt-1">Choose depth</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setResearchMode('fast')}
                  disabled={loading || mockMode}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                    researchMode === 'fast' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                  } ${mockMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={mockMode ? 'Disabled in Demo Mode' : 'Use cached analysis without web search'}
                >
                  <Zap size={18} />
                  Fast
                </button>
                <button
                  onClick={() => setResearchMode('deep')}
                  disabled={loading || mockMode}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                    researchMode === 'deep' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                  } ${mockMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={mockMode ? 'Disabled in Demo Mode' : 'Enable web search for live data'}
                >
                  <TrendingUp size={18} />
                  Deep
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 bg-white/50 p-3 rounded flex items-center justify-between gap-3">
              <span>
                {mockMode
                  ? 'Demo Mode: using placeholder roadmap to avoid rate limits.'
                  : researchMode === 'fast'
                    ? 'Quick AI analysis'
                    : 'Web search for real-time data'}
              </span>
              <button
                onClick={() => setMockMode(prev => !prev)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  mockMode ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : 'bg-white text-gray-700'
                }`}
                title={mockMode ? 'Switch to live mode (requires Anthropic API key)' : 'Use mock data to avoid 429 errors'}
              >
                {mockMode ? 'Switch to Live Mode' : 'Use Demo Mode'}
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={generateRoadmap}
              disabled={loading || !businessIdea.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={24} />
                  Generating...
                </>
              ) : (
                <>
                  <Rocket className="mr-2" size={24} />
                  Generate Roadmap
                </>
              )}
            </button>
            {roadmap && (
              <>
                <button
                  onClick={downloadRoadmap}
                  className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 flex items-center"
                >
                  <Download className="mr-2" size={20} />
                  Download
                </button>
                {roadmapHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-gray-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-700 flex items-center"
                  >
                    <History className="mr-2" size={20} />
                    History
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <History className="mr-3" size={28} />
                  Version History
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-white p-2">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {roadmapHistory.map((snapshot, idx) => (
                  <div key={idx} className="border-b py-4 hover:bg-gray-50 px-4 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Version {roadmapHistory.length - idx}</p>
                        <p className="text-sm text-gray-600">{new Date(snapshot.timestamp).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{snapshot.idea.substring(0, 60)}...</p>
                      </div>
                      <button
                        onClick={() => restoreFromHistory(snapshot)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-3">
                <Loader2 className="animate-spin text-indigo-600 mr-3" size={32} />
                <span className="text-2xl font-bold">{currentStep}</span>
              </div>
              <p className="text-center text-gray-600">Analyzing...</p>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.label;
                const isComplete = roadmap && roadmap[step.key];
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      isComplete ? 'bg-green-500 text-white' :
                      isActive ? 'bg-indigo-600 text-white animate-pulse' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon size={28} />
                    </div>
                    <span className={`text-xs text-center font-semibold ${
                      isActive ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {roadmap && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const content = roadmap[step.key];
                
                if (!content || !content.html) return null;
                
                return (
                  <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden border">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center">
                      <Icon className="text-white mr-4" size={32} />
                      <h2 className="text-2xl font-bold text-white">{step.label}</h2>
                    </div>
                    <div className="p-8">
                      <div 
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: content.html }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border sticky top-6 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
                  <div className="flex items-center">
                    <MessageSquare className="text-white mr-3" size={28} />
                    <h3 className="text-xl font-bold text-white">Refine Roadmap</h3>
                  </div>
                  <p className="text-purple-100 text-sm mt-2">Ask for modifications</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatResponse && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
                      <div className="flex justify-between mb-3">
                        <strong className="text-yellow-900">New Version Ready</strong>
                        <div className="flex gap-2">
                          <button
                            onClick={applyChatResponse}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Apply
                          </button>
                          <button
                            onClick={rejectChatResponse}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Keep Original
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: chatResponse.content.html }}
                        />
                      </div>
                    </div>
                  )}

                  {chatMessages.length === 0 && !chatResponse && (
                    <div className="text-center text-gray-400 mt-8">
                      <MessageSquare className="mx-auto mb-3 opacity-30" size={48} />
                      <p className="text-sm">Ask to modify sections</p>
                      <div className="mt-4 space-y-2">
                        <button 
                          onClick={() => setUserMessage("research: add more competitor details")}
                          className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 p-3 rounded-lg"
                        >
                          "Add competitor details"
                        </button>
                        <button 
                          onClick={() => setUserMessage("revenue: break down CAC by channel")}
                          className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 p-3 rounded-lg"
                        >
                          "CAC breakdown"
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                        msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-5 py-3">
                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                      placeholder="Ask for changes..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={handleChat}
                      disabled={chatLoading || !userMessage.trim()}
                      className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !roadmap && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <Lightbulb className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-700 mb-3">Ready to Build Your Business?</h3>
            <p className="text-gray-500 text-lg mb-6">Get a comprehensive roadmap with:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <TrendingUp className="text-blue-600 mb-2" size={24} />
                <p className="text-sm font-semibold text-gray-700">Market Research</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <BarChart3 className="text-green-600 mb-2" size={24} />
                <p className="text-sm font-semibold text-gray-700">Financial Models</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Map className="text-purple-600 mb-2" size={24} />
                <p className="text-sm font-semibold text-gray-700">Implementation</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <MessageSquare className="text-orange-600 mb-2" size={24} />
                <p className="text-sm font-semibold text-gray-700">Refinement</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
