from flask import Flask, request, jsonify
from keras.models import load_model
import numpy as np
from PIL import Image
import io

app = Flask(__name__)

# Load model
model = load_model("plant_disease_model.keras", compile=False)

# Class labels (⚠️ replace with your actual classes)
class_names = [
    "Healthy",
    "Powdery Mildew",
    "Leaf Spot",
    "Rust"
]

# Image preprocessing
def preprocess_image(image):
    image = image.resize((224, 224))  # match your model input
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        image = Image.open(file.stream).convert("RGB")

        processed = preprocess_image(image)

        prediction = model.predict(processed)[0]

        class_index = np.argmax(prediction)
        confidence = float(np.max(prediction))

        return jsonify({
            "prediction": class_names[class_index],
            "confidence": round(confidence * 100, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)