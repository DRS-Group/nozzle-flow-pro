import { useEffect, useLayoutEffect, useState } from "react";
import { services } from "../dependency-injection";

export function usePump() {
    const pumpService = services.pumpService;

    const [rawState, setRawState] = useState<'on' | 'off'>('off');
    const [pumpState, setPumpState] = useState<'on' | 'off'>('off');
    const [overriddenState, setOverriddenState] = useState<'on' | 'off' | 'auto'>('auto');
    const [isStabilized, setIsStabilized] = useState<boolean>(pumpService.getIsStabilized());

    useLayoutEffect(() => {
        setPumpState(pumpService.getState());
        setOverriddenState(pumpService.getOverriddenState());
        setRawState(pumpService.getRawState());

        const eventHandler = (state: 'on' | 'off') => {
            setPumpState(state);
            setRawState(pumpService.getRawState());
        }

        pumpService.addEventListener('onStateChanged', eventHandler);

        return () => {
            pumpService.removeEventListener('onStateChanged', eventHandler);
        }
    }, [setPumpState]);

    useLayoutEffect(() => {
        const eventHandler = (state: 'on' | 'off' | 'auto') => {
            setOverriddenState(state);
        }

        pumpService.addEventListener('onOverriddenStateChanged', eventHandler);

        return () => {
            pumpService.removeEventListener('onOverriddenStateChanged', eventHandler);
        }
    }, [setOverriddenState]);

    useLayoutEffect(()=>{
        const eventHandler = (isStabilized: boolean) => {
            setIsStabilized(isStabilized);
            console.log("Pump is stabilized:", isStabilized);
        }

        pumpService.addEventListener('onIsStabilizedChanged', eventHandler);

        return () => {
            pumpService.removeEventListener('onIsStabilizedChanged', eventHandler);
        }
    })

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
        setOverridden,
        rawState,
        isStabilized
    }
}