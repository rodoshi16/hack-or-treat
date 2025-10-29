import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export interface ExpressionData {
  expression: string;
  confidence: number;
}

export const useFacialExpression = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<ExpressionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🎯 [Hook] isDetecting changed to:', isDetecting);
  }, [isDetecting]);

  useEffect(() => {
    console.log('🎯 [Hook] isLoaded changed to:', isLoaded);
  }, [isLoaded]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('🤖 Loading face-api models...');
        
        // Load required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        
        console.log('✅ Face-api models loaded successfully');
        setIsLoaded(true);
      } catch (error) {
        console.error('❌ Error loading face-api models:', error);
        setError('Failed to load facial recognition models');
      }
    };

    loadModels();
  }, []);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      console.log('📷 [Hook] Starting camera...');
      console.log('📷 [Hook] videoRef.current:', videoRef.current);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 320, 
          height: 240,
          facingMode: 'user'
        }
      });
      
      console.log('📷 [Hook] Got media stream:', stream);
      
      if (videoRef.current) {
        console.log('📷 [Hook] Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        // Verify the video element is still available
        if (!videoRef.current) {
          throw new Error('Video element disappeared after setting srcObject');
        }
        
        console.log('📷 [Hook] Video srcObject set, waiting for metadata...');
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element disappeared'));
            return;
          }

          const onLoadedData = () => {
            console.log('📷 [Hook] Video metadata loaded');
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = (error: Event) => {
            console.error('📷 [Hook] Video error:', error);
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            reject(new Error('Video failed to load'));
          };

          video.addEventListener('loadeddata', onLoadedData);
          video.addEventListener('error', onError);
          
          video.play().catch((playError) => {
            console.error('📷 [Hook] Play error:', playError);
            reject(playError);
          });
        });
        
        console.log('📷 [Hook] Video element ready and playing');
      } else {
        console.warn('📷 [Hook] videoRef.current is null!');
        throw new Error('Video element not found');
      }
      
      console.log('✅ [Hook] Camera started successfully');
    } catch (error) {
      console.error('❌ [Hook] Error accessing camera:', error);
      setError('Failed to access camera. Please allow camera permissions.');
      throw error; // Re-throw so the caller knows it failed
    }
  }, []);

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
  };

  // Start expression detection
  const startDetection = useCallback(() => {
    console.log('🔍 [Hook] startDetection() called');
    console.log('🔍 [Hook] isLoaded:', isLoaded);
    console.log('🔍 [Hook] videoRef.current:', videoRef.current);
    console.log('🔍 [Hook] isDetecting before:', isDetecting);
    
    if (!isLoaded) {
      console.warn('🔍 [Hook] Models not loaded yet');
      return;
    }

    if (!videoRef.current) {
      console.warn('🔍 [Hook] No video element - waiting...');
      // Try again after a short delay to allow video element to mount
      setTimeout(() => {
        console.log('🔍 [Hook] Retrying startDetection after delay...');
        startDetection();
      }, 200); // Increased delay slightly
      return;
    }

    if (isDetecting) {
      console.warn('🔍 [Hook] Already detecting');
      return;
    }
    
    console.log('🔍 [Hook] Setting isDetecting to true...');
    setIsDetecting(true);
    setError(null);
    
    // Add a small delay to allow state to update before starting detection loop
    setTimeout(() => {
      console.log('🔍 [Hook] isDetecting state should now be true:', isDetecting);
    }, 50);
    
    const detectExpressions = async () => {
      const currentVideo = videoRef.current;
      if (!currentVideo) {
        console.log('🔍 [Hook] detectExpressions() stopped - no video element');
        setIsDetecting(false);
        return;
      }
      
      try {
        const detections = await faceapi
          .detectAllFaces(currentVideo, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          
          // Find the most confident expression
          let maxExpression = '';
          let maxConfidence = 0;
          
          Object.entries(expressions).forEach(([expression, confidence]) => {
            if (confidence > maxConfidence) {
              maxConfidence = confidence;
              maxExpression = expression;
            }
          });
          
          // Only update if confidence is above threshold
          if (maxConfidence > 0.5) {
            setCurrentExpression({
              expression: maxExpression,
              confidence: maxConfidence
            });
          }
        }
      } catch (error) {
        console.error('❌ Error detecting expressions:', error);
      }
      
      // Continue detection loop - check the state again
      // Use a ref to check the current state instead of the closure
      setTimeout(() => {
        if (videoRef.current && document.contains(videoRef.current)) {
          detectExpressions();
        } else {
          console.log('🔍 [Hook] Detection loop stopped - video element removed');
          setIsDetecting(false);
        }
      }, 100); // Check every 100ms
    };
    
    detectExpressions();
  }, [isLoaded, isDetecting]);

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);
    setCurrentExpression(null);
  };

  return {
    videoRef,
    isLoaded,
    isDetecting,
    currentExpression,
    error,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection
  };
};