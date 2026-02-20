import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Copy, Check } from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'rate-limits', title: 'Rate Limits' }
    ]
  },
  {
    id: 'chat-api',
    title: 'Chat API',
    items: [
      { id: 'create-completion', title: 'Create Completion' },
      { id: 'streaming', title: 'Streaming Responses' }
    ]
  },
  {
    id: 'image-api',
    title: 'Image API',
    items: [
      { id: 'generate-image', title: 'Generate Image' }
    ]
  },
  {
    id: 'video-api',
    title: 'Video API',
    items: [
      { id: 'generate-video', title: 'Generate Video' }
    ]
  }
];

const CodeBlock = ({ code, language = 'javascript' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#0d0d0d] border border-white/10 my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs text-gray-500 font-mono">{language}</span>
        <button 
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function Docs() {
  const [activeSection, setActiveSection] = useState('introduction');

  return (
    <div className="flex h-full">
      {/* Docs Sidebar */}
      <div className="w-64 hidden lg:block border-r border-white/5 bg-background-secondary/30 shrink-0 h-full overflow-y-auto p-6">
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="font-display font-bold text-sm text-white mb-3 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        activeSection === item.id
                          ? "bg-primary-neon/10 text-primary-neon font-medium"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 lg:p-12 max-w-4xl h-full overflow-y-auto">
        <div className="space-y-12">
          {/* Introduction */}
          <section id="introduction" className={cn(activeSection === 'introduction' ? 'block' : 'hidden')}>
            <h1 className="text-4xl font-display font-bold mb-6">Introduction</h1>
            <p className="text-lg text-gray-400 mb-6">
              Welcome to the NeonGen AI API documentation. Our API allows you to integrate powerful AI capabilities directly into your applications.
            </p>
            <div className="p-4 rounded-xl bg-primary-neon/10 border border-primary-neon/20 text-primary-neon mb-6">
              <strong>Note:</strong> This API is currently in preview. Breaking changes may occur.
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className={cn(activeSection === 'authentication' ? 'block' : 'hidden')}>
            <h1 className="text-3xl font-display font-bold mb-6">Authentication</h1>
            <p className="text-gray-400 mb-4">
              All API requests must include your API key in the <code>Authorization</code> header.
            </p>
            <CodeBlock 
              code={`curl https://api.neongen.ai/v1/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`} 
              language="bash" 
            />
          </section>

          {/* Chat Completion */}
          <section id="create-completion" className={cn(activeSection === 'create-completion' ? 'block' : 'hidden')}>
            <h1 className="text-3xl font-display font-bold mb-6">Create Chat Completion</h1>
            <p className="text-gray-400 mb-4">
              Generate a response from a chat model.
            </p>
            <CodeBlock 
              code={`const response = await fetch('https://api.neongen.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'gemini-3-pro-preview',
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});`} 
            />
          </section>

           {/* Generate Image */}
           <section id="generate-image" className={cn(activeSection === 'generate-image' ? 'block' : 'hidden')}>
            <h1 className="text-3xl font-display font-bold mb-6">Generate Image</h1>
            <p className="text-gray-400 mb-4">
              Create an image from a text prompt.
            </p>
            <CodeBlock 
              code={`const response = await fetch('https://api.neongen.ai/v1/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'gemini-3-pro-image-preview',
    prompt: 'A futuristic city with neon lights',
    size: '1024x1024'
  })
});`} 
            />
          </section>
        </div>
      </div>
    </div>
  );
}
