import React, { useRef, useState } from "react";
import "./App.css";

interface MemeFormData {
  image: File | null;
  topText: string;
  bottomText: string;
}

function App() {
  const [formData, setFormData] = useState<MemeFormData>({
    image: null,
    topText: "",
    bottomText: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [generatedMeme, setGeneratedMeme] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedMeme("");
      setError("");
    }
  };

  const handleTextChange = (field: "topText" | "bottomText", value: string) => {
    setFormData({ ...formData, [field]: value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image) {
      setError("Please select an image");
      return;
    }

    if (!formData.topText && !formData.bottomText) {
      setError("Please enter at least one text field");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", formData.image);
      formDataToSend.append("topText", formData.topText);
      formDataToSend.append("bottomText", formData.bottomText);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/generate-meme`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to generate meme");
      }

      const blob = await response.blob();
      const memeUrl = URL.createObjectURL(blob);
      setGeneratedMeme(memeUrl);
    } catch (err) {
      setError("Failed to generate meme. Please try again.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ image: null, topText: "", bottomText: "" });
    setPreviewUrl("");
    setGeneratedMeme("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (generatedMeme) {
      const link = document.createElement("a");
      link.href = generatedMeme;
      link.download = `meme-${Date.now()}.jpg`;
      link.click();
    }
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="p-10 flex flex-col gap-6">
        <header className="flex py-8">
          <h1 className="font-medium">Meme Generator</h1>
        </header>

        <div className="flex flex-col gap-4">
          <div className="">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2 bg-white/10 w-max items-center rounded-xl p-4">
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-sky-500 rounded-xl w-max p-3 cursor-pointer text-xl font-medium"
                />
                {formData.image && (
                  <span className="text-xl">{formData.image.name}</span>
                )}
              </div>

              {error && <div className="">{error}</div>}

              {formData.image && (
                <div className="flex gap-4">
                  {!generatedMeme && (
                    <button
                      type="submit"
                      disabled={isLoading || !formData.image}
                      className="border-sky-500 border-2 rounded-xl w-max py-3 px-4 cursor-pointer text-xl font-medium"
                    >
                      {isLoading ? "Generating..." : "Generate Meme"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="border-sky-500 border-2 rounded-xl w-max py-3 px-4 cursor-pointer text-xl font-medium"
                  >
                    Reset
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="flex flex-col gap-4">
            {generatedMeme ? (
              <div className="flex flex-col gap-4 w-full items-end">
                <button
                  onClick={handleDownload}
                  className="bg-sky-400 rounded-xl w-max py-3 px-4 cursor-pointer text-xl font-medium"
                >
                  Download Meme
                </button>
                <img src={generatedMeme} alt="Generated meme" className="" />
              </div>
            ) : previewUrl ? (
              <div className="flex flex-col gap-4">
                <h3 className="font-medium text-xl">Preview:</h3>
                <input
                  type="text"
                  value={formData.topText}
                  onChange={(e) => handleTextChange("topText", e.target.value)}
                  placeholder="Enter top text..."
                  className="bg-white/10 rounded-xl p-3 w-full text-xl font-medium"
                  maxLength={100}
                />
                <input
                  type="text"
                  value={formData.bottomText}
                  onChange={(e) =>
                    handleTextChange("bottomText", e.target.value)
                  }
                  placeholder="Enter bottom text..."
                  className="bg-white/10 rounded-xl p-3 w-full text-xl font-medium"
                  maxLength={100}
                />
                <img src={previewUrl} alt="Preview" className="" />
              </div>
            ) : (
              <div className="flex py-4">
                <p className="text-lg italic">Upload an image to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
