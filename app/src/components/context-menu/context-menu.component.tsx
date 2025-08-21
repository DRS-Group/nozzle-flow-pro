import styles from './context-menu.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type ContextMenuItem = {
    label: string;
    icon?: any;
    onClick: () => void;
}

export type ContextMenuElement = {

}

export type ContextMenuProps = {
    items: ContextMenuItem[];
    position: { x: number, y: number };
    onBackgroundClick?: () => void;
    onItemClick?: () => void;
}

export const ContextMenu = forwardRef<ContextMenuElement, ContextMenuProps>((props, ref) => {
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const [calculatedPosition, setCalculatedPosition] = useState<{ x: number, y: number }>({ x: window.innerWidth, y: window.innerHeight });

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        recalculateContextMenuPosition();
    }, [contextMenuRef.current]);


    const recalculateContextMenuPosition = () => {
        //client width and height
        const clientWidth = window.innerWidth;
        const clientHeight = window.innerHeight;

        //menu width and height
        const menuWidth = contextMenuRef.current?.clientWidth || 0;
        const menuHeight = contextMenuRef.current?.clientHeight || 0;

        const minLeft = 10;
        const maxLeft = clientWidth - menuWidth - 10;
        const minTop = 10;
        const maxTop = clientHeight - menuHeight - 10;

        if (menuWidth > 0 && menuHeight > 0) {
            setCalculatedPosition({
                x: Math.min(Math.max(props.position.x, minLeft), maxLeft),
                y: Math.min(Math.max(props.position.y, minTop), maxTop)
            });
        }
        else {
            setCalculatedPosition({ x: clientWidth, y: clientHeight });
        }
    }

    return (
        <div
            className={styles.background}
            onPointerDown={props.onBackgroundClick}
        >
            <div
                className={styles.wrapper}
                ref={contextMenuRef}
                style={{
                    left:
                        `${calculatedPosition?.x}px`,
                    top:
                        `${calculatedPosition?.y}px`
                }}
            >
                {props.items.map((item, index) => (
                    <div
                        key={index}
                        className={styles.item}
                        onPointerDown={() => {
                            props.onItemClick && props.onItemClick();
                            item.onClick();
                        }}

                    >
                        {item.icon && item.icon}
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
});