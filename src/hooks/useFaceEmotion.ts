'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { AnalysisResult, EmotionScores, EmotionLabel } from '@/lib/types';

export function useFaceEmotion() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionLabel>('neutral');
  const [emotionScores, setEmotionScores] = useState<EmotionScores>({
    happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;
    
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        
        if (isMounted) {
          setFaceLandmarker(landmarker);
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize MediaPipe:', err);
        if (isMounted) {
          setError('Failed to load face detection model. Please check your internet connection.');
          setIsModelLoading(false);
        }
      }
    };
    
    initModel();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const analyzeFace = useCallback(() => {
    if (!videoRef.current || !faceLandmarker) return;

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const currentTime = videoRef.current.currentTime;
        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;
          
          try {
            const result = faceLandmarker.detectForVideo(videoRef.current, performance.now());
            
            if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
              setFaceDetected(true);
              const categories = result.faceBlendshapes[0].categories;
              const blendshapes = Object.fromEntries(categories.map(c => [c.categoryName, c.score]));
              
              // Map blendshapes to our 7 basic emotions using heuristics
              const happyScore = Math.max(blendshapes.mouthSmileLeft, blendshapes.mouthSmileRight, blendshapes.cheekPuff);
              const sadScore = Math.max(blendshapes.mouthFrownLeft, blendshapes.mouthFrownRight, blendshapes.browInnerUp);
              const angryScore = Math.max(blendshapes.browDownLeft, blendshapes.browDownRight, blendshapes.mouthPressLeft);
              const surprisedScore = Math.max(blendshapes.jawOpen, blendshapes.eyeWideLeft, blendshapes.eyeWideRight) * 0.8;
              const fearfulScore = Math.max(blendshapes.mouthDimpleLeft, blendshapes.mouthDimpleRight, blendshapes.jawOpen * 0.5);
              const disgustedScore = Math.max(blendshapes.noseSneerLeft, blendshapes.noseSneerRight, blendshapes.mouthUpperUpLeft);
              
              const totalActivation = happyScore + sadScore + angryScore + surprisedScore + fearfulScore + disgustedScore;
              const neutralScore = Math.max(0, 1 - totalActivation);

              const sum = happyScore + sadScore + angryScore + surprisedScore + fearfulScore + disgustedScore + neutralScore;
              
              const normalized: EmotionScores = {
                happy: happyScore / sum,
                sad: sadScore / sum,
                angry: angryScore / sum,
                surprised: surprisedScore / sum,
                fearful: fearfulScore / sum,
                disgusted: disgustedScore / sum,
                neutral: neutralScore / sum,
              };

              setEmotionScores(normalized);
              const dominant = (Object.entries(normalized) as [EmotionLabel, number][])
                .sort((a, b) => b[1] - a[1])[0][0];
              setCurrentEmotion(dominant);
            } else {
              setFaceDetected(false);
            }
          } catch (e) {
            console.error('Detection error', e);
          }
        }
      }
      
      // Only continue loop if still active
      if (streamRef.current) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();
  }, [faceLandmarker]);

  const startCamera = useCallback(async () => {
    if (isModelLoading) {
      setError('Model is still loading. Please wait a moment.');
      return;
    }
    
    if (!faceLandmarker) {
      setError('Face model not initialized.');
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      
      // Start analysis loop
      analyzeFace();
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  }, [faceLandmarker, isModelLoading, analyzeFace]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsActive(false);
    setFaceDetected(false);
  }, []);

  const getResult = useCallback((): AnalysisResult => {
    const valence =
      emotionScores.happy * 1 +
      emotionScores.surprised * 0.3 +
      emotionScores.neutral * 0 +
      emotionScores.sad * -0.8 +
      emotionScores.angry * -0.7 +
      emotionScores.fearful * -0.5 +
      emotionScores.disgusted * -0.6;

    const arousal =
      emotionScores.angry * 0.9 +
      emotionScores.surprised * 0.8 +
      emotionScores.happy * 0.6 +
      emotionScores.fearful * 0.7 +
      emotionScores.disgusted * 0.4 +
      emotionScores.sad * 0.2 +
      emotionScores.neutral * 0.1;

    return {
      dominantEmotion: currentEmotion,
      emotionScores,
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      aiInterpretation: '',
      source: 'face',
    };
  }, [emotionScores, currentEmotion]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    faceDetected,
    currentEmotion,
    emotionScores,
    error,
    isModelLoading,
    startCamera,
    stopCamera,
    getResult,
  };
}
