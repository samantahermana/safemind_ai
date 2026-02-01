import { HIGH_RISK_KEYWORDS, SUSPICIOUS_PATTERNS } from '../utils/const';
import dataset from './dataset.json';
import wordIndex from './word_index.json';
import stringSimilarity from 'string-similarity';



export const analyzeRisk = async (message: string) => {
  const normalized = message.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  // 1. TOKENIZACIÓN
  const tokens = words.map(word => (wordIndex as any)[word] || 1);
  
  // 2. PADDING
  const inputSize = 40; 
  const paddedInput = [...tokens, ...Array(inputSize).fill(0)].slice(0, inputSize);

  console.log("🔢 Tensor generado:", paddedInput);

  // 3. ANÁLISIS FUZZY LOGIC (Principal)
  const variations = dataset.map(item => item.variacion_sintetica.toLowerCase());
  const fuzzy = stringSimilarity.findBestMatch(normalized, variations);

  let isAnomalous = false;
  let riskLevel = 0;
  let engine = 'FUZZY_LOGIC';
  let groomingStage = 'Normal';
  let confidence = fuzzy.bestMatch.rating;

  // Ajustar umbral según longitud del mensaje
  const threshold = words.length < 6 ? 0.35 : 0.45;

  // Detección primaria: Match directo con dataset
  if (fuzzy.bestMatch.rating > threshold) {
    isAnomalous = true;
    riskLevel = dataset[fuzzy.bestMatchIndex].nivel_riesgo;
    groomingStage = dataset[fuzzy.bestMatchIndex].etapa_grooming;
  }

  // 4. ANÁLISIS CONTEXTUAL AVANZADO (Refuerzo)
  let keywordCount = 0;
  let patternMatches = 0;

  // Contar palabras clave de riesgo
  HIGH_RISK_KEYWORDS.forEach(keyword => {
    if (normalized.includes(keyword)) keywordCount++;
  });

  // Detectar patrones sospechosos
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(normalized)) patternMatches++;
  });

  // Ajustar el nivel de riesgo basado en contexto
  if (keywordCount >= 2 || patternMatches >= 1) {
    if (!isAnomalous) {
      // Si fuzzy no lo detectó pero hay muchos indicadores, marcar como sospechoso
      isAnomalous = true;
      riskLevel = 6 + keywordCount; // Nivel medio-alto
      groomingStage = 'Contexto Sospechoso';
      engine = 'CONTEXTUAL_ANALYSIS';
    } else {
      // Si fuzzy ya lo detectó, aumentar el nivel de confianza
      riskLevel = Math.min(10, riskLevel + Math.floor(keywordCount / 2));
    }
  }

  // 5. ANÁLISIS DE LONGITUD (Mensajes muy cortos son menos confiables)
  if (words.length < 3 && isAnomalous) {
    riskLevel = Math.max(1, riskLevel - 2); // Reducir riesgo en mensajes muy cortos
  }

  console.log(`📊 Análisis: ${isAnomalous ? '⚠️ RIESGO' : '✅ SEGURO'} | Nivel: ${riskLevel} | Keywords: ${keywordCount} | Patrones: ${patternMatches} | Confianza: ${(confidence * 100).toFixed(1)}%`);

  return { isAnomalous, riskLevel, engine, groomingStage };
};