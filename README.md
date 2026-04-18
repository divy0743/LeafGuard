# 🌿 LeafGuard — AI Plant Disease Detection
LeafGuard is a deep learning-based web application that detects plant diseases from leaf images.  
It uses a Convolutional Neural Network (MobileNetV2) to classify diseases in **apple and corn crops**, providing real-time predictions with confidence scores and top-3 probabilities.
---
## 🚀 Features
- 🔍 Detects diseases from leaf images
- ⚡ Real-time inference (~30–80 ms)
- 📊 Confidence score + Top-3 predictions
- 🌿 Supports Apple and Corn diseases
- 🧠 Transfer learning with MobileNetV2
- 📁 History tracking of past predictions
- ⚠️ Handles uncertainty between similar diseases
- 🌐 Full-stack app (Flask + React)
---
## 🧠 Model Details
- Architecture: **MobileNetV2 (Transfer Learning)**
- Input size: `224x224`
- Training strategy:
  - Frozen base layers
  - Fine-tuning last layers
- Output: Softmax probabilities over disease classes
### Classes:
- Apple:
  - Apple Scab
  - Black Rot
  - Cedar Apple Rust
  - Healthy
- Corn:
  - Common Rust
  - Northern Leaf Blight
  - Healthy
---
## 📊 Dataset
- Primary: **PlantVillage Dataset**
- Preprocessing:
  - Image resizing
  - Data augmentation
  - Class balancing
⚠️ Note:
PlantVillage uses lab images, so real-world generalization may vary.
---
## 🛠️ Tech Stack
### Backend
- Python
- Flask
- TensorFlow / Keras
### Frontend
- React (TypeScript)
- Tailwind CSS
- Lucide Icons
---
## ⚙️ Installation
### 1. Clone repo
```bash
git clone https://github.com/yourusername/leafguard.git
cd leafguard
```
⸻

2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```
Run server:
```bash
python app.py
```
Backend runs at:

http://127.0.0.1:5000

⸻

3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
⸻

📡 API Endpoint

POST /predict

Upload image as form-data:

Response:
```bash
{
  "prediction": "Apple - Apple scab",
  "confidence": 98.45,
  "top3": [
    {"label": "...", "confidence": 98.45},
    {"label": "...", "confidence": 1.2},
    {"label": "...", "confidence": 0.3}
  ],
  "process_time": 0.031
}
```
⸻

🖼️ How it works

1. User uploads leaf image
2. Image is preprocessed (resize + normalize)
3. CNN model performs inference
4. Top predictions returned
5. UI displays result + confidence

⸻

⚠️ Limitations

* Trained primarily on PlantVillage (lab dataset)
* May confuse similar diseases (e.g., scab vs black rot)
* Real-world lighting and backgrounds affect accuracy

⸻

🔮 Future Improvements

* Add real-world datasets (PlantDoc, Plant Pathology 2020)
* Improve scab vs black rot differentiation
* Grad-CAM visualization (model explainability)
* Mobile deployment
* Disease-specific treatment recommendations

⸻

🤝 Contributing

Contributions are welcome!

* Fork the repo
* Create a new branch
* Submit a PR

⸻


🙌 Acknowledgements

* PlantVillage Dataset
* TensorFlow & Keras
* MobileNetV2 architecture
