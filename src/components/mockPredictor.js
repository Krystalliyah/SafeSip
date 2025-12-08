


//MOCK AND WILL DELETE THIS AFTERRRRRRRRRRRRRR


// src/services/mockPredictor.js
export const mockPredict = (waterData) => {
  console.log('Mock prediction for:', waterData);
  
  // Enhanced mock ML logic based on water quality standards
  let score = 0;
  
  // pH (ideal: 6.5-8.5)
  if (waterData.ph >= 6.5 && waterData.ph <= 8.5) score += 20;
  else if (waterData.ph >= 6.0 && waterData.ph <= 9.0) score += 10;
  
  // Hardness (ideal: 50-150 mg/L)
  if (waterData.hardness >= 50 && waterData.hardness <= 150) score += 15;
  else if (waterData.hardness > 0 && waterData.hardness < 400) score += 5;
  
  // Solids (ideal: <500 mg/L)
  if (waterData.solids < 500) score += 15;
  else if (waterData.solids < 2000) score += 8;
  else if (waterData.solids < 10000) score += 3;
  
  // Chloramines (ideal: <4 mg/L)
  if (waterData.chloramines < 4) score += 10;
  else if (waterData.chloramines < 8) score += 5;
  
  // Sulfate (ideal: <250 mg/L)
  if (waterData.sulfate < 250) score += 10;
  else if (waterData.sulfate < 500) score += 5;
  
  // Conductivity (ideal: 200-800 μS/cm)
  if (waterData.conductivity >= 200 && waterData.conductivity <= 800) score += 10;
  else if (waterData.conductivity >= 100 && waterData.conductivity <= 1000) score += 5;
  
  // Trihalomethanes (ideal: <80 μg/L)
  if (waterData.trihalomethanes < 80) score += 5;
  else if (waterData.trihalomethanes < 120) score += 2;
  
  // Turbidity (ideal: <5 NTU)
  if (waterData.turbidity < 5) score += 5;
  else if (waterData.turbidity < 8) score += 2;
  
  // Organic Carbon (ideal: <10 mg/L)
  if (waterData.organic_carbon < 10) score += 5;
  else if (waterData.organic_carbon < 20) score += 2;
  
  const isPotable = score >= 60;
  const confidence = 0.6 + (score / 200); // 60-85% confidence based on score
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        potable: isPotable ? 1 : 0,
        confidence: Math.min(0.95, confidence).toFixed(3),
        message: isPotable ? '✅ Potable Water' : '❌ Not Potable',
        details: isPotable 
          ? `This water sample meets ${Math.round(score)}% of potability criteria. The water appears safe for drinking based on the analyzed parameters.`
          : `This water sample meets only ${Math.round(score)}% of potability criteria. Consider laboratory testing before consumption.`,
        score: Math.round(score),
        timestamp: new Date().toISOString(),
        parameters: waterData,
      });
    }, 1200); // Simulate API delay
  });
};