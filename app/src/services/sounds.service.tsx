export namespace SoundsService {
    const alertSound = new Audio(`${process.env.PUBLIC_URL}/sounds/alert.mp3`);
    const clickSound = new Audio(`${process.env.PUBLIC_URL}/sounds/click.mp3`);

    export const playSound = async (sound: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const audio = new Audio(sound);
            audio.onended = () => {
                resolve();
            }
            await audio.play();
        });
    }

    export const playAlertSound = async (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            alertSound.onended = () => {
                resolve();
            }
            alertSound.play();
        });
    }

    export const playClickSound = async (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            clickSound.onended = () => {
                resolve();
            }
            clickSound.currentTime = 0;
            clickSound.play();
        });
    }
}