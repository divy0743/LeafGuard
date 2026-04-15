import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Clock,
  Trash2,
} from "lucide-react";

// ── Types matching your Flask /predict response ───────────────────────────────
type Top3Item = {
  label: string;
  confidence: number; // already 0-100 from backend
};

type DetectionResult = {
  prediction: string;   // e.g. "Tomato - Early blight"
  confidence: number;   // 0-100 (backend sends percentage directly)
  top3: Top3Item[];
  precautions: string[];       // generated client-side via Claude API
  recommendations: string[];   // generated client-side via Claude API
};

interface HistoryEntry {
  id: string;
  image: string;
  fileName: string;
  result: DetectionResult;
  timestamp: Date;
}

// ── Helper: ask Claude API to generate precautions + recommendations ──────────
async function fetchAdvice(
  prediction: string
): Promise<{ precautions: string[]; recommendations: string[] }> {
  const isHealthy = prediction.toLowerCase().includes("healthy");

  if (isHealthy) {
    return {
      precautions: [
        "Continue regular watering and fertilization schedule.",
        "Monitor for early signs of pests or discoloration weekly.",
        "Ensure good air circulation between plants.",
        "Rotate crops each season to prevent soil-borne diseases.",
      ],
      recommendations: [
        "Plant appears healthy — no treatment required.",
        "Maintain current care routine for best results.",
        "Consider preventive fungicide spray during humid seasons.",
      ],
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `The crop disease detected is: "${prediction}".

Return ONLY a valid JSON object with no extra text, no markdown, no code fences. Use exactly this shape:
{
  "precautions": ["...","...","...","..."],
  "recommendations": ["...","...","...","..."]
}

precautions = 4 short preventive/safety measures (what to do to stop spread).
recommendations = 4 short actionable treatment steps (how to treat now).
Keep each item under 20 words.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content
      .map((c: { type: string; text?: string }) =>
        c.type === "text" ? c.text : ""
      )
      .join("");

    const parsed = JSON.parse(text.trim());
    return {
      precautions: parsed.precautions ?? [],
      recommendations: parsed.recommendations ?? [],
    };
  } catch {
    return {
      precautions: [
        "Isolate affected plants immediately to prevent spread.",
        "Avoid overhead watering; water at the base instead.",
        "Remove and destroy infected plant material safely.",
        "Disinfect tools after use on affected plants.",
      ],
      recommendations: [
        "Apply an appropriate fungicide or bactericide as labelled.",
        "Consult your local agricultural extension office for guidance.",
        "Improve air circulation and reduce humidity around plants.",
        "Monitor remaining plants closely over the next two weeks.",
      ],
    };
  }
}

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<HistoryEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setError(null);
    setFileName(file.name);
    setSelectedFile(file);
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
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1️⃣ Send image to your Flask backend
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to analyze image");
      }

      const raw = await response.json();
      // raw = { prediction: string, confidence: number (0-100), top3: [...] }

      // 2️⃣ Generate precautions + recommendations via Claude API
      const advice = await fetchAdvice(raw.prediction);

      const data: DetectionResult = {
        prediction: raw.prediction,
        confidence: raw.confidence, // already 0-100
        top3: raw.top3,
        precautions: advice.precautions,
        recommendations: advice.recommendations,
      };

      setResult(data);

      // 3️⃣ Save to history
      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        image: selectedImage!,
        fileName: fileName || "unknown",
        result: data,
        timestamp: new Date(),
      };
      setHistory((prev) => [historyEntry, ...prev]);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (selectedHistoryEntry?.id === id) setSelectedHistoryEntry(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSelectedHistoryEntry(null);
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry);
    setSelectedImage(null);
    setFileName(null);
    setResult(null);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setFileName(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // confidence is 0-100 from backend; disease = no "healthy" in prediction string
  const isDiseaseDetected =
    result && !result.prediction.toLowerCase().includes("healthy");

  const isHistoryEntryDisease = (entry: HistoryEntry) =>
    !entry.result.prediction.toLowerCase().includes("healthy");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          {history.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Clock className="w-4 h-4" />
              History ({history.length})
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
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

        {/* History View */}
        {showHistory && history.length > 0 ? (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-emerald-900 flex items-center gap-2">
                <Clock className="w-8 h-8" />
                Detection History
              </h2>
              <Button
                variant="outline"
                onClick={handleClearHistory}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleLoadHistory(entry)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${
                    selectedHistoryEntry?.id === entry.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={entry.image}
                      alt={entry.fileName}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {entry.result.confidence.toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 mb-1">
                      {entry.result.prediction}
                    </p>
                    <p className="text-xs text-gray-600 mb-3 truncate">
                      {entry.fileName}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {entry.timestamp.toLocaleDateString()}{" "}
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFromHistory(entry.id);
                      }}
                      className="w-full text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedHistoryEntry && (
              <div className="pt-8 border-t border-emerald-100">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6">
                  {selectedHistoryEntry.result.prediction} - Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <img
                      src={selectedHistoryEntry.image}
                      alt={selectedHistoryEntry.fileName}
                      className="w-full rounded-lg"
                    />
                    <p className="text-center text-gray-600 mt-4 text-sm">
                      {selectedHistoryEntry.fileName}
                    </p>
                  </div>
                  <div>
                    <div
                      className={`rounded-2xl p-8 border-2 ${
                        isHistoryEntryDisease(selectedHistoryEntry)
                          ? "bg-orange-50 border-orange-200"
                          : "bg-emerald-50 border-emerald-200"
                      } mb-6`}
                    >
                      <div className="flex items-start gap-4 mb-6">
                        {isHistoryEntryDisease(selectedHistoryEntry) ? (
                          <div className="p-3 bg-orange-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-100 rounded-full">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900">
                            {selectedHistoryEntry.result.prediction}
                          </h4>
                          <p
                            className={`text-sm font-medium ${
                              isHistoryEntryDisease(selectedHistoryEntry)
                                ? "text-orange-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {isHistoryEntryDisease(selectedHistoryEntry)
                              ? "Disease Detected"
                              : "Healthy"}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Confidence Level
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {selectedHistoryEntry.result.confidence.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHistoryEntryDisease(selectedHistoryEntry)
                                ? "bg-gradient-to-r from-orange-500 to-red-600"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600"
                            }`}
                            style={{
                              width: `${selectedHistoryEntry.result.confidence}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-lg">🛡️</span> Precautions
                        </h5>
                        <ul className="space-y-3">
                          {selectedHistoryEntry.result.precautions.map(
                            (precaution, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 text-sm text-gray-700"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                                {precaution}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-lg">💊</span> Treatment
                          Recommendations
                        </h5>
                        <ul className="space-y-3">
                          {selectedHistoryEntry.result.recommendations.map(
                            (rec, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 text-sm text-gray-700"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                                {rec}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowHistory(false)}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      New Detection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
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
                            {result.prediction}
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
                            {result.confidence.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDiseaseDetected
                                ? "bg-gradient-to-r from-orange-500 to-red-600"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600"
                            }`}
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                      </div>

                      {/* Precautions */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-lg">🛡️</span> Precautions
                        </h4>
                        <ul className="space-y-3">
                          {result.precautions.map((precaution, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-gray-700"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                              {precaution}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-lg">💊</span> Treatment
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
                      Click the "Analyze Image" button to run the CNN model on
                      your leaf image. This will detect any diseases and provide
                      treatment recommendations.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="text-lg">🔍</span> Advanced neural
                        network analysis
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="text-lg">⚡</span> Process time: ~2
                        seconds
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="text-lg">📊</span> High accuracy
                        detection
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
          </>
        )}

        {/* Footer Info */}
        <div className="mt-16 pt-12 border-t border-emerald-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { number: "95%", label: "Detection Accuracy" },
              { number: "50+", label: "Crop Diseases Identified" },
              { number: "24/7", label: "Available Anytime" },
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