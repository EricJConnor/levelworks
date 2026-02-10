import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';

type Message = { role: 'user' | 'assistant'; content: string; timestamp: Date; };

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { estimates, clients, jobs } = useData();

  useEffect(() => { loadChatHistory(); }, []);

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data, error } = await supabase.from('ai_chat_history').select('*').eq('user_id', user.id).order('timestamp', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setMessages(data.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content, timestamp: new Date(msg.timestamp) })));
      } else {
        setMessages([{ role: 'assistant', content: "Hi! I'm your contractor AI assistant. I can help with estimates, material calculations, code requirements, and project planning. What can I help you with?", timestamp: new Date() }]);
      }
    } catch (error) { console.error('Error loading chat:', error); }
  };

  const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!userId) return;
    try { await supabase.from('ai_chat_history').insert({ user_id: userId, role, content }); } catch (error) { console.error('Error saving:', error); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const starterPrompts = ["Calculate materials for 12x15 room", "Building code for deck railings?", "Estimate a kitchen remodel", "Charge per sq ft?"];

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage('user', input);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    try {
      const appContext = { estimates: estimates.map(e => ({ projectName: e.projectName, clientName: e.clientName, status: e.status, total: e.total })), clients: clients.map(c => ({ name: c.name, totalJobs: c.totalJobs })), jobs: jobs.map(j => ({ clientName: j.clientName, projectType: j.projectType, status: j.status })) };
      const conversationHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { message: currentInput, conversationHistory, appContext } });
      if (error) throw error;
      const aiResponse = data?.choices?.[0]?.message?.content || "I'm having trouble responding. Please try again.";
      const assistantMessage: Message = { role: 'assistant', content: aiResponse, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
      await saveChatMessage('assistant', aiResponse);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold mb-1">AI Assistant</h2>
          <p className="text-xs md:text-sm text-blue-100">Get help with estimates, codes & planning</p>
        </div>

        {messages.length === 1 && messages[0].role === 'assistant' && (
          <div className="p-3 md:p-4 border-b">
            <p className="text-xs text-gray-600 mb-2">Try asking:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starterPrompts.map((prompt, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => setInput(prompt)} className="text-left justify-start h-auto py-2 px-3 text-xs">{prompt}</Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="whitespace-pre-line text-sm">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t bg-white">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." className="flex-1 border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 px-6 py-3">Send</Button>
          </div>
        </div>

      </Card>
    </div>
  );
};
