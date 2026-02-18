import {
  BENIGN_PATTERNS,
  HIGH_RISK_KEYWORDS,
  SAFE_CONTEXT_KEYWORDS,
  SUSPICIOUS_PATTERNS,
} from '../utils/const';
import dataset from './dataset.json';
import wordIndex from './word_index.json';
import stringSimilarity from 'string-similarity';

export const analyzeRisk = async (message: string) => {
  const normalized = message.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  // Verificar si es un mensaje benigno común
  for (const pattern of BENIGN_PATTERNS) {
    if (pattern.test(normalized)) {
      console.log('✅ Mensaje benigno detectado');
      return {
        isAnomalous: false,
        riskLevel: 0,
        engine: 'BENIGN_FILTER',
        groomingStage: 'Normal',
      };
    }
  }

  // Mensajes muy cortos sin contexto sospechoso son considerados normales
  if (words.length <= 2 && !normalized.match(/foto|video|desnud|secret/i)) {
    console.log('✅ Mensaje muy corto y sin indicadores');
    return {
      isAnomalous: false,
      riskLevel: 0,
      engine: 'LENGTH_FILTER',
      groomingStage: 'Normal',
    };
  }

  // 1. TOKENIZACIÓN
  const tokens = words.map(word => (wordIndex as any)[word] || 1);

  // 2. PADDING
  const inputSize = 40;
  const paddedInput = [...tokens, ...Array(inputSize).fill(0)].slice(
    0,
    inputSize,
  );

  console.log('🔢 Tensor generado:', paddedInput);

  // 3. ANÁLISIS FUZZY LOGIC (Principal)
  const variations = dataset.map(item =>
    item.variacion_sintetica.toLowerCase(),
  );
  const fuzzy = stringSimilarity.findBestMatch(normalized, variations);

  let isAnomalous = false;
  let riskLevel = 0;
  let engine = 'FUZZY_LOGIC';
  let groomingStage = 'Normal';
  let confidence = fuzzy.bestMatch.rating;

  // Ajustar umbral según longitud del mensaje - MÁS ESTRICTO
  const threshold = words.length < 5 ? 0.55 : words.length < 10 ? 0.5 : 0.45;

  // Detección primaria: Match directo con dataset
  if (fuzzy.bestMatch.rating > threshold) {
    isAnomalous = true;
    riskLevel = dataset[fuzzy.bestMatchIndex].nivel_riesgo;
    groomingStage = dataset[fuzzy.bestMatchIndex].etapa_grooming;
  }

  // 4. ANÁLISIS CONTEXTUAL AVANZADO
  let keywordCount = 0;
  let patternMatches = 0;
  let safeContextCount = 0;

  // Contar palabras clave de riesgo
  HIGH_RISK_KEYWORDS.forEach(keyword => {
    if (normalized.includes(keyword)) {
      keywordCount++;
    }
  });

  // Detectar patrones sospechosos
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(normalized)) {
      patternMatches++;
    }
  });

  // Contar palabras de contexto seguro
  SAFE_CONTEXT_KEYWORDS.forEach(keyword => {
    if (normalized.includes(keyword)) {
      safeContextCount++;
    }
  });

  // Ajustar el nivel de riesgo basado en contexto - MÁS ESTRICTO
  // Se requieren múltiples indicadores fuertes para marcar como riesgo
  if ((keywordCount >= 3 && patternMatches >= 1) || patternMatches >= 2) {
    if (!isAnomalous) {
      // Si fuzzy no lo detectó pero hay MUCHOS indicadores, marcar como sospechoso
      isAnomalous = true;
      riskLevel = 5 + keywordCount; // Nivel medio
      groomingStage = 'Contexto Sospechoso';
      engine = 'CONTEXTUAL_ANALYSIS';
    } else {
      // Si fuzzy ya lo detectó, aumentar el nivel de confianza
      riskLevel = Math.min(10, riskLevel + Math.floor(keywordCount / 2));
    }
  }

  // 5. ANÁLISIS DE LONGITUD (Mensajes cortos requieren más evidencia)
  if (words.length < 5 && isAnomalous) {
    // Reducir significativamente el riesgo en mensajes cortos
    riskLevel = Math.max(0, riskLevel - 3);
    if (riskLevel < 5) {
      isAnomalous = false; // Descartar si el riesgo es muy bajo
    }
  }

  console.log(
    `📊 Análisis: ${
      isAnomalous ? '⚠️ RIESGO' : '✅ SEGURO'
    } | Nivel: ${riskLevel} | Keywords: ${keywordCount} | Patrones: ${patternMatches} | Contexto seguro: ${safeContextCount} | Confianza: ${(
      confidence * 100
    ).toFixed(1)}%`,
  );

  return {isAnomalous, riskLevel, engine, groomingStage};
};
