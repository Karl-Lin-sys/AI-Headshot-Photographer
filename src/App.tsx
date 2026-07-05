import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, Loader2, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const STYLES = [
  { id: "corporate", label: "Corporate Grey", prompt: "Professional corporate headshot with a solid neutral grey backdrop, soft studio lighting, sharp focus, 85mm lens, highly detailed, photorealistic." },
  { id: "modern-tech", label: "Modern Tech", prompt: "Professional headshot in a modern tech office environment, blurred glass walls in the background, natural indirect lighting, cinematic, photorealistic." },
  { id: "outdoor", label: "Outdoor Natural", prompt: "Professional headshot taken outdoors in a bustling city environment, shallow depth of field, natural sunlight, bokeh background, photorealistic." },
  { id: "creative", label: "Creative Studio", prompt: "Creative professional headshot, colorful gel lighting in the background, stylish, moody, high fashion editorial style, photorealistic." },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let prompt = customPrompt;
      if (!prompt) {
        const style = STYLES.find((s) => s.id === selectedStyle);
        prompt = style ? style.prompt : STYLES[0].prompt;
      }
      
      if (selectedImage) {
        prompt = `Edit the provided photo into the following style: ${prompt}. Keep the subject's face identical, but change the clothing, background, and lighting.`;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          prompt,
          aspectRatio: "3:4", // Portrait for headshots
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image.");
      }

      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Studio Headshots</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight mb-4"
          >
            Professional Headshots, <span className="text-zinc-400">Instantly.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            Upload a casual selfie, choose a style, and let AI generate a polished professional headshot for your profile.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Step 1: Upload */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                Upload your selfie
              </h2>
              
              {!selectedImage ? (
                <div
                  className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 bg-zinc-900/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-300 font-medium mb-1">Click to upload image</p>
                  <p className="text-xs text-zinc-500">JPG, PNG up to 10MB</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-zinc-950 aspect-[3/4] max-w-xs mx-auto border border-zinc-800">
                  <img src={selectedImage} alt="Uploaded selfie" className="w-full h-full object-cover" />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-sm text-zinc-300 hover:text-white p-2 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </section>

            {/* Step 2: Choose Style */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                Choose a style
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style.id);
                      setCustomPrompt("");
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedStyle === style.id && !customPrompt
                        ? "bg-indigo-500/10 border-indigo-500"
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mb-2 ${
                      selectedStyle === style.id && !customPrompt ? "bg-indigo-500" : "bg-zinc-700"
                    }`} />
                    <div className="font-medium text-sm">{style.label}</div>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-zinc-900 text-xs text-zinc-500">OR WRITE YOUR OWN</span>
                </div>
              </div>

              <div className="mt-6">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. A professional headshot in an art studio, natural light, wearing a black turtleneck..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
                />
              </div>
            </section>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!selectedImage && !customPrompt && !selectedStyle)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Headshot
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-zinc-400"
                >
                  <div className="w-16 h-16 relative mb-6">
                    <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-lg font-medium text-zinc-300">Working magic...</p>
                  <p className="text-sm mt-2 text-center max-w-xs">Our AI is analyzing your image and generating a high-quality professional portrait.</p>
                </motion.div>
              ) : generatedImage ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col"
                >
                  <div className="flex-1 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 relative group">
                    <img
                      src={generatedImage}
                      alt="Generated headshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <a
                        href={generatedImage}
                        download="ai-headshot.png"
                        className="bg-white text-zinc-900 font-medium px-4 py-2 rounded-full flex items-center transform translate-y-4 group-hover:translate-y-0 transition-all hover:bg-zinc-200"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Full Image
                      </a>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-zinc-500"
                >
                  <div className="w-24 h-24 bg-zinc-950 rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-lg font-medium text-zinc-400">Your portrait will appear here</p>
                  <p className="text-sm mt-2">Fill out the steps on the left to get started.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
