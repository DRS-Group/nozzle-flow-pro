import { useEffect, useState } from "react";
import { SettingsService } from "../services/settings.service";


export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState<boolean>(true);
    const [isPasswordSet, setIsPasswordSet] = useState<boolean>(true);

    useEffect(() => {
        setIsAdmin(SettingsService.getIsAdmin());

        const eventHandler = (isAdmin: boolean) => {
            setIsAdmin(isAdmin);
        }

        SettingsService.addEventListener('onIsAdminChanged', eventHandler);
        return () => {
            SettingsService.removeEventListener('onIsAdminChanged', eventHandler);
        }
    }, [setIsAdmin]);

    useEffect(() => {
        SettingsService.isAdminPasswordSet().then((isPasswordSet) => {
            setIsPasswordSet(isPasswordSet);
        });

        const eventHandler = () => {
            SettingsService.isAdminPasswordSet().then((isPasswordSet) => {
                setIsPasswordSet(isPasswordSet);
            });
        }

        SettingsService.addEventListener('onAdminPasswordChanged', eventHandler);
        return () => {
            SettingsService.removeEventListener('onAdminPasswordChanged', eventHandler);
        }
    }, [setIsPasswordSet]);

    const enterAdminMode = () => {
        SettingsService.setIsAdmin(true);
    }

    const exitAdminMode = () => {
        SettingsService.setIsAdmin(false);
    }

    const setPassword = (password: string) => {
        SettingsService.setAdminPassword(password);
    }

    const checkPassword = (password: string) => {
        return SettingsService.checkAdminPassword(password);
    }

    return { isAdmin, enterAdminMode, exitAdminMode, isPasswordSet, setPassword, checkPassword };
}