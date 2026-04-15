import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import json

app = Flask(__name__)
CORS(app)

# ✅ Load .keras model
model = tf.keras.models.load_model("plant_disease_model.keras")

# 🔹 Warm-up
model.predict(np.zeros((1, 224, 224, 3), dtype=np.float32))

# 🔹 Load classes
with open("class_names.json") as f:
    class_names = json.load(f)

# 🔹 Preprocess (IMPORTANT: NO scaling because model already has Rescaling)
def preprocess_image(image):
    image = image.resize((224, 224))
    image = np.array(image, dtype=np.float32)

    image = np.expand_dims(image, axis=0)
    return image

@app.route("/")
def home():
    return "API is running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        image = Image.open(file.stream).convert("RGB")

        processed = preprocess_image(image)

        # 🔥 NORMAL prediction
        prediction = model.predict(processed)[0]

        print("Top raw probs:", np.sort(prediction)[-5:])

        class_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        print("Top predictions:")
    
        top5_idx = np.argsort(prediction)[::-1][:5]

        for i in top5_idx:
            print(class_names[i], prediction[i])

        top3_idx = np.argsort(prediction)[::-1][:3]
        top3 = [
            {
                "label": class_names[i].replace("___", " - ").replace("_", " "),
                "confidence": round(float(prediction[i]) * 100, 2)
            }
            for i in top3_idx
        ]

        label = class_names[class_index].replace("___", " - ").replace("_", " ")

        return jsonify({
            "prediction": label,
            "confidence": round(confidence * 100, 2),
            "top3": top3
        })

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/test")
def test():
    try:
        # dummy input (same shape as model expects)
        dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)

        preds = model.predict(dummy)[0]

        print("Raw output:", preds)
        print("Top class index:", np.argmax(preds))

        return jsonify({
            "status": "Model working",
            "top_class_index": int(np.argmax(preds)),
            "confidence": float(np.max(preds))
        })

    except Exception as e:
        print("Error in test route:", str(e))
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)