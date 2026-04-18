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
