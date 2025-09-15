import sys
import whisper
import os

def main():
    if len(sys.argv) < 2:
        print("No audio file provided")
        return

    audio_path = sys.argv[1]

    if not os.path.isfile(audio_path):
        print("File not found")
        return

    try:
        model = whisper.load_model("tiny")
        result = model.transcribe(audio_path, fp16=False)
        print(result["text"])
    except Exception as e:
        print(f"Transcription failed: {str(e)}")

if __name__ == "__main__":
    main()