import sys
import whisper
import os

def main():
    if len(sys.argv) < 2:
        print("No audio file provided")
        return
    
    audio_path = sys.argv[1]
    
    try:
        # جرب tiny model أولاً
        model = whisper.load_model("tiny")
        result = model.transcribe(audio_path, fp16=False)
        print(result["text"])
    except Exception as e:
        print(f"Transcription failed: {str(e)}")
        # رجع نص فارغ إذا فشل
        print("")

if __name__ == "__main__":
    main()