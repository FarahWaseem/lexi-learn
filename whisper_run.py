import sys
import whisper

def main():
    if len(sys.argv) < 2:
        print("No audio file provided")
        return

    audio_path = sys.argv[1]

    # Load the Whisper model
    model = whisper.load_model("base")  # You can change the model size if needed

    # Transcribe the audio file
    result = model.transcribe(audio_path, fp16=False)

    # Print the transcription
    print(result["text"])

if __name__ == "__main__":
    main()