import { ScreenReader } from "@capacitor/screen-reader";

export namespace SoundsService {
    export const playSound = async (sound: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const audio = new Audio(sound);
            audio.onended = () => {
                resolve();
            }
            await audio.play();
        });
    }

    export const textToSpeech = async (text: string, language: string): Promise<void> => {
        ScreenReader.speak({ value: text, language: 'en' });
    }

    export const playAlertSound = async (): Promise<void> => {
        return playSound('/sounds/alert.mp3')
    }
}