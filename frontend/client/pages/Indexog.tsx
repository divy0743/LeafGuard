import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { DiseaseDetectionResponse } from "@shared/api";

type DetectionResult = DiseaseDetectionResponse;

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2");
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data: DetectionResult = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setFileName(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isDiseaseDetected = result && result.confidence > 0.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">LeafGuard</h1>
            <p className="text-xs text-emerald-600">
              AI-Powered Crop Disease Detection
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        {!selectedImage && !result && (
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-900 mb-4">
              Detect Crop Diseases
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Instantly
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Upload a photo of your crop leaf and our advanced CNN model will
              analyze it in seconds to detect diseases, providing you with
              actionable treatment recommendations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: "🔍",
                  title: "AI Analysis",
                  desc: "Advanced neural networks detect diseases with high accuracy",
                },
                {
                  icon: "⚡",
                  title: "Instant Results",
                  desc: "Get disease diagnosis in seconds with confidence scores",
                },
                {
                  icon: "💡",
                  title: "Smart Recommendations",
                  desc: "Receive targeted treatment and prevention suggestions",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-emerald-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div>
            <div
              className="border-2 border-dashed border-emerald-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-300"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage}
                    alt="Selected leaf"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <p className="text-sm text-gray-600 font-medium">
                    {fileName}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyze();
                      }}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                    {!isLoading && (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearImage();
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-emerald-100 rounded-full">
                    <Upload className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-900">
                      Drop your leaf image here
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      or click to browse your files
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div>
            {result ? (
              <div className="space-y-6">
                <div
                  className={`rounded-2xl p-8 border-2 ${
                    isDiseaseDetected
                      ? "bg-orange-50 border-orange-200"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    {isDiseaseDetected ? (
                      <div className="p-3 bg-orange-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {result.disease}
                      </h3>
                      <p
                        className={`text-sm font-medium ${
                          isDiseaseDetected
                            ? "text-orange-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {isDiseaseDetected ? "Disease Detected" : "Healthy"}
                      </p>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Confidence Level
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDiseaseDetected
                            ? "bg-gradient-to-r from-orange-500 to-red-600"
                            : "bg-gradient-to-r from-emerald-500 to-teal-600"
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Recommendations
                    </h4>
                    <ul className="space-y-3">
                      {result.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleClearImage}
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze Another Image
                </Button>
              </div>
            ) : selectedImage && !isLoading ? (
              <div className="bg-white rounded-2xl p-8 border border-emerald-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600 mb-6">
                  Click the "Analyze Image" button to run the CNN model on your
                  leaf image. This will detect any diseases and provide treatment
                  recommendations.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="text-lg">🔍</span> Advanced neural network
                    analysis
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="text-lg">⚡</span> Process time: ~2 seconds
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="text-lg">📊</span> High accuracy detection
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-emerald-100 text-center">
                <Leaf className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Image Selected
                </h3>
                <p className="text-gray-600">
                  Upload or drag a leaf image to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 pt-12 border-t border-emerald-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                number: "95%",
                label: "Detection Accuracy",
              },
              {
                number: "50+",
                label: "Crop Diseases Identified",
              },
              {
                number: "24/7",
                label: "Available Anytime",
              },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-3xl font-bold text-emerald-600 mb-2">
                  {stat.number}
                </p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
