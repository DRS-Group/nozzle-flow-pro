import { useEffect, useState } from "react";
import { services } from "../dependency-injection";

export function usePump() {
    const pumpService = services.pumpService;

    const [pumpState, setPumpState] = useState<'on' | 'off'>('off');
    const [overriddenState, setOverriddenState] = useState<'on' | 'off' | 'auto'>('auto');

    useEffect(() => {
        setPumpState(pumpService.getState());
        setOverriddenState(pumpService.getOverriddenState());

        const eventHandler = (state: 'on' | 'off') => {
            setPumpState(state);
        }

        pumpService.addEventListener('onStateChanged', eventHandler);

        return () => {
            pumpService.removeEventListener('onStateChanged', eventHandler);
        }
    }, [setPumpState]);

    useEffect(() => {
        const eventHandler = (state: 'on' | 'off' | 'auto') => {
            setOverriddenState(state);
        }

        pumpService.addEventListener('onOverriddenStateChanged', eventHandler);

        return () => {
            pumpService.removeEventListener('onOverriddenStateChanged', eventHandler);
        }
    }, [setOverriddenState]);

    const setState = (state: 'on' | 'off') => {
        pumpService.setState(state);
    }

    const setOverridden = (state: 'on' | 'off' | 'auto') => {
        pumpService.setOverriddenState(state);
    }

    return {
        pumpState,
        overriddenState,
        setState,
        setOverridden
    }
}