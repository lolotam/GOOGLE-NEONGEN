import { ParticleBackground } from '@/components/ui/ParticleBackground';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Zap, Image as ImageIcon, Video, MessageSquare } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-6 rounded-2xl bg-background-secondary/50 border border-white/5 backdrop-blur-sm hover:border-primary-neon/30 transition-colors"
  >
    <div className="w-12 h-12 rounded-xl bg-primary-neon/10 flex items-center justify-center mb-4 text-primary-neon">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-display font-bold mb-2">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </motion.div>
);

export default function Home() {
  return (
    <div className="relative min-h-full overflow-y-auto h-full">
      <ParticleBackground />
      
      <div className="relative z-10 px-6 py-20 lg:px-12 lg:py-32 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-neon/10 text-primary-neon text-sm font-medium mb-6 border border-primary-neon/20">
              v1.0.0 Now Available
            </span>
            <h1 className="text-5xl lg:text-7xl font-display font-bold mb-8 tracking-tight leading-tight">
              Create the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-neon to-primary-lime">Impossible</span> with AI
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              The next-generation studio for creators and developers. Generate stunning images, cinematic videos, and intelligent conversations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/generate/image"
                className="px-8 py-4 rounded-xl bg-primary-neon text-background-primary font-bold text-lg hover:bg-primary-lime transition-colors flex items-center gap-2"
              >
                Start Creating <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/docs"
                className="px-8 py-4 rounded-xl bg-white/5 text-white font-medium text-lg hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"
              >
                View API Docs <Code className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          <FeatureCard 
            icon={ImageIcon}
            title="Image Generation"
            description="Create photorealistic images with Gemini and Imagen models. Support for 4K resolution and advanced style controls."
          />
          <FeatureCard 
            icon={Video}
            title="Video Production"
            description="Generate cinematic videos with Veo. Extend clips, control camera movement, and maintain consistency."
          />
          <FeatureCard 
            icon={MessageSquare}
            title="Intelligent Chat"
            description="Engage with advanced language models for coding, writing, and analysis. Multi-turn conversations with context."
          />
        </div>

        {/* API Highlight */}
        <div className="rounded-3xl bg-background-secondary border border-white/5 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 p-8 lg:p-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold mb-6">Built for Developers</h2>
              <p className="text-gray-400 text-lg mb-8">
                Integrate our powerful AI models directly into your applications with our robust API. 
                Simple, scalable, and developer-friendly.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Simple REST API endpoints',
                  'Comprehensive SDK support',
                  'Real-time streaming responses',
                  'Usage analytics & monitoring'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-primary-neon/20 flex items-center justify-center text-primary-neon">
                      <Zap className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/docs" className="text-primary-neon font-medium hover:underline">
                Read the documentation &rarr;
              </Link>
            </div>
            
            <div className="bg-[#0d0d0d] rounded-xl border border-white/10 p-6 font-mono text-sm overflow-x-auto">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <pre className="text-gray-300">
                <code>
{`// Generate an image with the API
const response = await neon.images.generate({
  model: 'gemini-3-pro-image-preview',
  prompt: 'A cyberpunk city with neon lights',
  size: '1024x1024',
  quality: 'hd'
});

console.log(response.url);
// https://api.neongen.ai/v1/images/...`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
