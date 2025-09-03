import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
    }
  }, []);

  // Configure recognition
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onResult?.({
          transcript: finalTranscript,
          confidence: event.results[event.results.length - 1][0].confidence || 0,
          isFinal: true
        });
      }

      if (interimText) {
        setInterimTranscript(interimText);
        onResult?.({
          transcript: interimText,
          confidence: 0,
          isFinal: false
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      onError?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onstart = () => {
      setIsListening(true);
    };
  }, [continuous, interimResults, language, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      onError?.('Speech recognition not supported');
      return;
    }

    try {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Failed to start speech recognition');
    }
  }, [isSupported, onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  };
};