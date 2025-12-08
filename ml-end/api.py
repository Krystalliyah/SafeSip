from flask import Flask, request, jsonify
import joblib
import json
import numpy as np
import pandas as pd
from flask_cors import CORS  

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "http://localhost:3000"}})

# Load model and metadata at startup
svm_pipeline = joblib.load("svm_water_pipeline.pkl")

with open("svm_water_metadata.json", "r") as f:
    metadata = json.load(f)

to_drop = metadata["to_drop"]
skewed_cols = metadata["skewed_cols"]
input_feature_names = metadata["input_feature_names"]

# Map frontend keys → model column names
API_TO_MODEL = {
    "ph": "ph",
    "hardness": "Hardness",
    "solids": "Solids",
    "chloramines": "Chloramines",
    "sulfate": "Sulfate",
    "conductivity": "Conductivity",
    "organic_carbon": "Organic_carbon",
    "trihalomethanes": "Trihalomethanes",
    "turbidity": "Turbidity",
}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    # 1. Build model input dict using full original feature names
    try:
        model_input = {}
        for api_key, model_col in API_TO_MODEL.items():
            if api_key not in data:
                return jsonify({"error": f"Missing field: {api_key}"}), 400
            model_input[model_col] = float(data[api_key])
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid numeric value in input."}), 400

    # 2. Create DataFrame with one row
    df = pd.DataFrame([model_input])

    # 3. Apply same pre-processing as during training
    # 3a. Drop correlated columns
    df = df.drop(columns=to_drop, errors="ignore")

    # 3b. Log-transform skewed columns
    for col in skewed_cols:
        if col in df.columns:
            df[col] = np.log1p(df[col])

    # 4. Predict
    proba = svm_pipeline.predict_proba(df)[0]  # [P(class0), P(class1)]
    pred_class = int(svm_pipeline.predict(df)[0])

    label = "Potable" if pred_class == 1 else "Not potable"
    confidence = float(max(proba))              # highest probability
    prob_potable = float(proba[1])
    prob_not_potable = float(proba[0])

    return jsonify({
        "prediction": label,
        "prob_potable": prob_potable,
        "prob_not_potable": prob_not_potable,
        "confidence": confidence,
        "confidence_percent": confidence * 100.0
    })

if __name__ == "__main__":
    # simple dev mode
    app.run(host="127.0.0.1", port=5000, debug=True)
